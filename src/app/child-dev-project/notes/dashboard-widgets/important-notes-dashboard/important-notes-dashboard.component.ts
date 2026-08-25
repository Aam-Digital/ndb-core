import {
  ChangeDetectionStrategy,
  Component,
  computed,
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

  // Bumped whenever the "warning-levels" enum config changes, to force a rebuild below.
  // The index's ordinal lookup is baked in from that enum's *current* state at build
  // time, which may not be loaded yet when the widget first mounts (e.g. during initial
  // sync/demo-data generation) - the index would otherwise be permanently built with an
  // empty lookup and never retry once the config actually arrives.
  private configVersion = signal(0);

  // Bumped whenever a relevant Note changes, to make `pageLoader` below produce a new
  // function reference (without rebuilding the index) so DashboardListWidgetComponent
  // re-fetches the current page. Notes are typically created progressively (e.g. during
  // initial sync/demo-data generation), so an initial empty/partial page must be retried
  // once more matching Notes actually arrive - nothing else would trigger that retry,
  // since `pageLoader` is otherwise only re-created when warningLevels()/the index change.
  private dataVersion = signal(0);

  // Built once per warningLevels()/configVersion() change (not per page query) - the
  // effect below updates this; `pageLoader` awaits it before querying.
  private indexBuilt = signal<Promise<void>>(Promise.resolve());

  /**
   * Loads one page of important notes (highest warningLevel first) directly from a
   * dedicated PouchDB/CouchDB view, instead of loading and filtering/sorting all Notes
   * client-side - see `ImportantNotesIndexService`. A new function reference is produced
   * whenever `warningLevels()`, the index, or relevant Note data changes, so
   * `DashboardListWidgetComponent` knows to restart paging from page 0 and re-fetch.
   */
  pageLoader = computed(() => {
    const relevantLevels = this.warningLevels();
    const indexBuilt = this.indexBuilt();
    this.dataVersion();
    return async (skip: number, limit: number) => {
      await indexBuilt;
      return this.importantNotesIndex.queryIndex(relevantLevels, skip, limit);
    };
  });

  subtitle = input<string>(
    $localize`:dashboard widget subtitle:Notes needing follow-up`,
  );
  explanation = input<string>(
    $localize`:dashboard widget explanation:Notes require immediate attention or follow-up actions`,
  );

  constructor() {
    effect(() => {
      const relevantLevels = this.warningLevels();
      this.configVersion(); // re-run when the warning-levels enum config changes
      this.indexBuilt.set(this.importantNotesIndex.buildIndex(relevantLevels));
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
