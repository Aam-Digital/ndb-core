import { EntityForm } from "#src/app/core/common-components/entity-form/entity-form";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
  ViewEncapsulation,
} from "@angular/core";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { MatMenuModule } from "@angular/material/menu";
import { MatProgressBar } from "@angular/material/progress-bar";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { Angulartics2Module } from "angulartics2";
import { CustomDatePipe } from "../../../core/basic-datatypes/date/custom-date.pipe";
import { EntityFormService } from "../../../core/common-components/entity-form/entity-form.service";
import { EntityFormComponent } from "../../../core/common-components/entity-form/entity-form/entity-form.component";
import { ViewActionsComponent } from "../../../core/common-components/view-actions/view-actions.component";
import { ViewTitleComponent } from "../../../core/common-components/view-title/view-title.component";
import { ConfigService } from "../../../core/config/config.service";
import { DynamicComponent } from "../../../core/config/dynamic-components/dynamic-component.decorator";
import { AbstractEntityDetailsComponent } from "../../../core/entity-details/abstract-entity-details/abstract-entity-details.component";
import { EntityArchivedInfoComponent } from "../../../core/entity-details/entity-archived-info/entity-archived-info.component";
import { EntityListConfig } from "../../../core/entity-list/EntityListConfig";
import { EntityConstructor } from "../../../core/entity/model/entity";
import { ExportColumnConfig } from "../../../core/export/data-transformation-service/export-column-config";
import { ExportDialogComponent } from "../../../core/export/export-dialog/export-dialog.component";
import { DialogButtonsComponent } from "../../../core/form-dialog/dialog-buttons/dialog-buttons.component";
import { getDefaultNoteDetailsConfig } from "../add-default-note-views";
import { Note } from "../model/note";

/**
 * Component responsible for displaying the Note creation/view window
 */
@UntilDestroy()
@DynamicComponent("NoteDetails")
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-note-details",
  templateUrl: "./note-details.component.html",
  styleUrls: ["./note-details.component.scss"],
  imports: [
    MatDialogModule,
    CustomDatePipe,
    FontAwesomeModule,
    Angulartics2Module,
    EntityFormComponent,
    DialogButtonsComponent,
    MatMenuModule,
    EntityArchivedInfoComponent,
    ViewTitleComponent,
    MatProgressBar,
    ViewActionsComponent,
  ],
  encapsulation: ViewEncapsulation.None,
})
export class NoteDetailsComponent extends AbstractEntityDetailsComponent {
  private configService = inject(ConfigService);
  private entityFormService = inject(EntityFormService);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  override readonly entityConstructor = computed<EntityConstructor>(() => Note);

  /** export format for notes to be used for downloading the individual details */
  readonly exportConfig = computed<ExportColumnConfig[]>(
    () =>
      this.configService.getConfig<{ config: EntityListConfig }>("view:note")
        ?.config.exportConfig,
  );

  private readonly defaultFormConfig = getDefaultNoteDetailsConfig();
  topForm = input(this.defaultFormConfig.topForm);
  middleForm = input(this.defaultFormConfig.middleForm);
  bottomForm = input(this.defaultFormConfig.bottomForm);

  readonly topFieldGroups = computed(() =>
    this.topForm().map((f) => ({ fields: [f] })),
  );
  readonly middleFieldGroups = computed(() => [{ fields: this.middleForm() }]);
  readonly bottomFieldGroups = computed(() => [{ fields: this.bottomForm() }]);

  readonly form = signal<EntityForm<Note> | undefined>(undefined);
  readonly tmpEntity = signal<Note | undefined>(undefined);

  constructor() {
    super();

    effect((onCleanup) => {
      const entity = this.entity();
      this.topForm();
      this.middleForm();
      this.bottomForm();
      let cancelled = false;
      onCleanup(() => {
        cancelled = true;
      });
      void this.initForm(entity as Note, () => cancelled);
    });

    // Subscribe to form value changes; onCleanup tears down stale subscription on re-init.
    effect((onCleanup) => {
      const currentForm = this.form();
      const entity = this.entity() as Note;
      if (!currentForm || !entity) return;
      const sub = currentForm.formGroup.valueChanges
        .pipe(untilDestroyed(this))
        .subscribe((value) => {
          this.tmpEntity.set(Object.assign(entity.copy(), value));
        });
      onCleanup(() => sub.unsubscribe());
    });
  }

  openExportDialog() {
    const entity = this.entity() as Note;
    const dateStr = entity?.date ? entity.date.toISOString().split("T")[0] : "";
    const filename = `event_${entity?.toString()?.replaceAll(" ", "-")}_${dateStr}`;
    this.dialog.open(ExportDialogComponent, {
      data: {
        allEntities: entity ? [entity] : [],
        exportConfig: this.exportConfig(),
        filename,
      },
    });
  }

  private async initForm(
    entity: Note,
    isCancelled: () => boolean = () => false,
  ) {
    if (!entity) return;

    const newForm = await this.entityFormService.createEntityForm(
      this.middleForm().concat(this.topForm(), this.bottomForm()),
      entity,
      this.destroyRef,
    );

    if (isCancelled()) return;
    this.tmpEntity.set(entity.copy());
    this.form.set(newForm); // triggers the valueChanges effect
  }
}
