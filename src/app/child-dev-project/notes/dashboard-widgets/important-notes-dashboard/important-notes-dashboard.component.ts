import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { debounceTime } from "rxjs";
import { Note } from "../../model/note";
import { DynamicComponent } from "../../../../core/config/dynamic-components/dynamic-component.decorator";
import { FormDialogService } from "../../../../core/form-dialog/form-dialog.service";
import { DashboardListWidgetComponent } from "../../../../core/dashboard/dashboard-list-widget/dashboard-list-widget.component";
import { MatTableModule } from "@angular/material/table";
import { CustomDatePipe } from "../../../../core/basic-datatypes/date/custom-date.pipe";
import { ImportantNotesIndexService } from "./important-notes-index.service";
import { EntityMapperService } from "../../../../core/entity/entity-mapper/entity-mapper.service";
import { ConfigurableEnum } from "../../../../core/basic-datatypes/configurable-enum/configurable-enum";
import { Logging } from "#src/app/core/logging/logging.service";

@DynamicComponent("ImportantNotesDashboard")
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-important-notes-dashboard",
  templateUrl: "./important-notes-dashboard.component.html",
  styleUrls: ["./important-notes-dashboard.component.scss"],
  imports: [DashboardListWidgetComponent, MatTableModule, CustomDatePipe],
})
export class ImportantNotesDashboardComponent {
  private formDialog = inject(FormDialogService);
  private importantNotesIndex = inject(ImportantNotesIndexService);
  private entityMapper = inject(EntityMapperService);

  static getRequiredEntities() {
    return Note.ENTITY_TYPE;
  }

  warningLevels = input<string[]>([]);

  // Bumped whenever the "warning-levels" enum config changes, to force an index rebuild.
  // The index's ordinal lookup is baked in from that enum's *current* state at build
  // time, which may not be loaded yet when the widget first mounts (e.g. during initial
  // sync/demo-data generation) - the index would otherwise be permanently built with an
  // empty lookup and never retry once the config actually arrives.
  private configVersion = signal(0);

  // Bumped whenever a Note changes, to re-query the index. Notes are typically created
  // progressively (e.g. during initial sync/demo-data generation), so an initial
  // empty/partial result must be refreshed once more matching Notes actually arrive.
  private dataVersion = signal(0);

  /**
   * The important notes (highest warningLevel first) to display, loaded already filtered
   * and sorted from a dedicated PouchDB/CouchDB view instead of loading all Notes and
   * filtering/sorting them client-side - see `ImportantNotesIndexService`.
   */
  notes = signal<Note[] | undefined>(undefined);

  subtitle = input<string>(
    $localize`:dashboard widget subtitle:Notes needing follow-up`,
  );
  explanation = input<string>(
    $localize`:dashboard widget explanation:Notes require immediate attention or follow-up actions`,
  );

  constructor() {
    effect((onCleanup) => {
      const relevantLevels = this.warningLevels();
      this.configVersion(); // re-run when the warning-levels enum config changes
      this.dataVersion(); // re-run when a Note changes

      let isCurrent = true;
      onCleanup(() => (isCurrent = false));

      void (async () => {
        await this.importantNotesIndex
          .buildIndex(relevantLevels)
          .catch((err) =>
            Logging.error("Failed to build index for important notes", err),
          );
        const notes = await this.importantNotesIndex
          .queryIndex(relevantLevels)
          .catch((err) => {
            Logging.error("Failed to load important notes", err);
            return [];
          });
        if (isCurrent) {
          this.notes.set(notes);
        }
      })();
    });

    this.entityMapper
      .receiveUpdates(ConfigurableEnum)
      .pipe(debounceTime(300), takeUntilDestroyed())
      .subscribe(() => this.configVersion.update((v) => v + 1));

    this.entityMapper
      .receiveUpdates(Note)
      .pipe(debounceTime(300), takeUntilDestroyed())
      .subscribe(() => this.dataVersion.update((v) => v + 1));
  }

  openNote(note: Note) {
    this.formDialog.openView(note);
  }
}
