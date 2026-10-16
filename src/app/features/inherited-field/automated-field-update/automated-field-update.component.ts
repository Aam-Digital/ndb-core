import { EntityForm } from "#src/app/core/common-components/entity-form/entity-form";
import { EntityFieldEditComponent } from "#src/app/core/entity/entity-field-edit/entity-field-edit.component";
import { EntitySchemaService } from "#src/app/core/entity/schema/entity-schema.service";
import {
  Component,
  DestroyRef,
  inject,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatButton } from "@angular/material/button";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { EntityBlockComponent } from "#src/app/core/basic-datatypes/entity/entity-block/entity-block.component";
import { DialogCloseComponent } from "#src/app/core/common-components/dialog-close/dialog-close.component";
import { EntityFormService } from "#src/app/core/common-components/entity-form/entity-form.service";
import { FormFieldConfig } from "#src/app/core/common-components/entity-form/FormConfig";
import { EntityFieldViewComponent } from "#src/app/core/entity/entity-field-view/entity-field-view.component";
import { HelpButtonComponent } from "#src/app/core/common-components/help-button/help-button.component";
import { MatTooltipModule } from "@angular/material/tooltip";
import { EntityFieldLabelPipe } from "#src/app/core/entity/entity-field-label/entity-field-label.pipe";
import { isEqual, uniq } from "lodash-es";
import { concatMap, debounceTime, Subject, switchMap } from "rxjs";
import { addHigherLevels } from "./add-higher-levels";
import { Entity, EntityConstructor } from "#src/app/core/entity/model/entity";

/**
 * Represents an entity that will be affected by a status update.
 * This interface is used to define the structure of the data
 * that will be passed to the
 * AutomatedFieldUpdateComponent for processing.
 */
export interface AffectedEntity {
  /** entityId of the affected entity */
  id: string;

  /** New value to be applied to the target field */
  newValue: string;

  /** Field Id that will receive the status update */
  targetFieldId: string;

  /** Entity type constructor for the target entity */
  targetEntityType: EntityConstructor;

  /** Actual entity which is being modified through automatedconfig rule */
  affectedEntity?: Entity;

  /** Reference field name that triggered the status update */
  relatedReferenceField: string;

  /** Entity type where the related reference field is defined */
  relatedReferenceFieldEntityType?: EntityConstructor;

  form?: EntityForm<Entity>;
  selectedField?: FormFieldConfig;

  /** Whether the new value is merged into the existing values instead of replacing them completely */
  addToExisting?: boolean;

  /** Whether the entities linked to the affected entity have no value in common, so the current value is kept */
  hasNoCommonValue?: boolean;

  /** Whether the affected entity is no longer linked to the changed entity */
  unlinked?: boolean;

  /** The field of the changed entity that this update is based on */
  sourceFieldId?: string;

  /** How many levels above the changed entity the affected entity is (1 = directly linked) */
  level?: number;

  /** Ids of the records this one is reached from (the changed entity, or affected entities of the level below) */
  via?: string[];

  /** Whether the user changed the suggested value */
  edited?: boolean;

  /** Whether the suggestion changed after the user had changed the value (the value of the user is kept) */
  suggestionChanged?: boolean;
}

/** The change that opened the update dialog */
export interface UpdateTrigger {
  /** The changed entity */
  entity: Entity;

  /** The changed entity before the change (the same as entity if there is no change) */
  before: Entity;
}

/** How long to wait for further changes of the user before the entities above are updated */
const RECALCULATION_DELAY_MS = 300;

function isSameRow(a: AffectedEntity, b: AffectedEntity): boolean {
  return a.id === b.id && a.targetFieldId === b.targetFieldId;
}

/**
 * A confirmation dialog for the user to review and confirm
 * the automated updates of fields in related entities,
 * after a triggering entity has been updated.
 *
 * (also see AutomatedFieldUpdateConfigService)
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-automated-field-update",
  imports: [
    DialogCloseComponent,
    EntityFieldEditComponent,
    EntityBlockComponent,
    EntityFieldLabelPipe,
    EntityFieldViewComponent,
    FontAwesomeModule,
    HelpButtonComponent,
    MatTooltipModule,
    MatButton,
    MatDialogModule,
  ],
  templateUrl: "./automated-field-update.component.html",
  styleUrl: "./automated-field-update.component.scss",
})
export class AutomatedFieldUpdateComponent implements OnInit {
  data = inject<{
    entities: AffectedEntity[];
    trigger?: UpdateTrigger;
    /**
     * Finds the entities that would be updated next if the given affected entity had its suggested value,
     * taking into account all given affected entities with their suggested values
     */
    loadNextLevel?: (
      affected: AffectedEntity,
      found: AffectedEntity[],
    ) => Promise<AffectedEntity[]>;
  }>(MAT_DIALOG_DATA);
  private dialogRef =
    inject<MatDialogRef<AutomatedFieldUpdateComponent>>(MatDialogRef);
  private readonly entityFormService = inject(EntityFormService);
  private readonly entitySchemaService = inject(EntitySchemaService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  entityConstructor: EntityConstructor;

  /** The affected entities that are shown, the ones above the first level are updated when a value is changed */
  readonly rows = signal<AffectedEntity[]>(this.data.entities);

  /** Whether the entities above are being updated after a change, which has to finish before saving */
  readonly recalculating = signal(false);

  private readonly firstLevel = this.data.entities
    .filter((entity) => (entity.level ?? 1) === 1)
    .map((entity) => ({ ...entity }));
  private readonly valueChanged = new Subject<void>();
  private changeCount = 0;

  /** The fields of the changed entity that caused the update, to show what changed */
  readonly triggerChanges = this.getTriggerChanges();

  /**
   * The first entity directly linked to the changed entity, if all of them are linked through the same field
   * (otherwise each of them shows how it is linked).
   */
  readonly sharedLinkEntity: AffectedEntity | undefined =
    this.getSharedLinkEntity();

  private getSharedLinkEntity(): AffectedEntity | undefined {
    const firstLevel = this.data.entities.filter(
      (entity) => (entity.level ?? 1) === 1,
    );
    return firstLevel.every(
      (entity) =>
        entity.relatedReferenceField === firstLevel[0].relatedReferenceField &&
        entity.relatedReferenceFieldEntityType ===
          firstLevel[0].relatedReferenceFieldEntityType,
    )
      ? firstLevel[0]
      : undefined;
  }

  private getTriggerChanges(): {
    field: FormFieldConfig;
    isChanged: boolean;
  }[] {
    const trigger = this.data.trigger;
    if (!trigger) return [];

    const entityType = trigger.entity.getConstructor();
    const isChanged = (fieldId: string) =>
      JSON.stringify(trigger.before[fieldId]) !==
      JSON.stringify(trigger.entity[fieldId]);
    const firstLevel = this.data.entities.filter(
      (entity) => (entity.level ?? 1) === 1,
    );
    // the value that is passed on, and the link to the affected entities if it was changed
    const fieldIds = uniq([
      ...firstLevel.map((entity) => entity.sourceFieldId),
      ...firstLevel
        .filter(
          (entity) => entity.relatedReferenceFieldEntityType === entityType,
        )
        .map((entity) => entity.relatedReferenceField)
        .filter(isChanged),
    ]).filter((fieldId) => !!fieldId);
    return fieldIds.map((fieldId) => ({
      field: this.entityFormService.extendFormFieldConfig(fieldId, entityType),
      isChanged: isChanged(fieldId),
    }));
  }

  async ngOnInit(): Promise<void> {
    this.recalculateOnChange();
    for (const entity of this.data.entities) {
      await this.initRow(entity);
    }
    this.cdr.markForCheck();
  }

  private async initRow(entity: AffectedEntity): Promise<void> {
    const fieldId = entity.targetFieldId;

    entity.selectedField = this.entityFormService.extendFormFieldConfig(
      fieldId,
      entity.targetEntityType,
    );

    entity.form = await this.entityFormService.createEntityForm(
      [fieldId],
      entity.affectedEntity,
      this.destroyRef,
    );

    const control = entity.form.formGroup.controls[fieldId];
    control.setValue(
      this.entitySchemaService.valueToEntityFormat(
        entity.newValue,
        entity.selectedField,
      ),
    );
    control.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.onValueChange(entity));
  }

  private onValueChange(entity: AffectedEntity): void {
    entity.edited = !isEqual(this.getDatabaseValue(entity), entity.newValue);
    entity.suggestionChanged = entity.edited && entity.suggestionChanged;
    this.changeCount++;
    this.recalculating.set(true);
    this.valueChanged.next();
  }

  /** The current value of the form field, in the format of the suggested value */
  private getDatabaseValue(entity: AffectedEntity) {
    return this.entitySchemaService.valueToDatabaseFormat(
      entity.form.formGroup.controls[entity.targetFieldId].value,
      entity.selectedField,
      entity.affectedEntity,
    );
  }

  /** Suggest the values of the entities above again whenever a value is changed, as they are based on it */
  private recalculateOnChange(): void {
    if (!this.data.loadNextLevel || !this.data.trigger) return;

    this.valueChanged
      .pipe(
        debounceTime(RECALCULATION_DELAY_MS),
        switchMap(async () => {
          const changes = this.changeCount;
          return { changes, higherLevels: await this.loadHigherLevels() };
        }),
        concatMap(async ({ changes, higherLevels }) => {
          await this.showRows(higherLevels);
          return changes;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((changes) => {
        if (changes === this.changeCount) {
          this.recalculating.set(false);
        }
      });
  }

  private loadHigherLevels(): Promise<AffectedEntity[]> {
    return addHigherLevels(
      this.firstLevel,
      this.data.trigger.entity.getId(),
      (source, found) =>
        this.data.loadNextLevel(
          this.withEnteredValue(source),
          found.map((row) => this.withEnteredValue(row)),
        ),
    );
  }

  /** What the user entered is the base for the entities above, instead of the suggestion */
  private withEnteredValue(suggestion: AffectedEntity): AffectedEntity {
    const row = this.rows().find((r) => isSameRow(r, suggestion));
    return row?.edited
      ? { ...suggestion, newValue: this.getDatabaseValue(row) }
      : suggestion;
  }

  /** Show the given entities, keeping the form (and so the changes of the user) of the ones that are shown already */
  private async showRows(entities: AffectedEntity[]): Promise<void> {
    const rows: AffectedEntity[] = [];
    for (const next of entities) {
      const row = this.rows().find((r) => isSameRow(r, next));
      if (!row) {
        await this.initRow(next);
        rows.push(next);
        continue;
      }

      row.suggestionChanged =
        row.edited &&
        (row.suggestionChanged || !isEqual(row.newValue, next.newValue));
      Object.assign(row, {
        newValue: next.newValue,
        level: next.level,
        via: next.via,
        hasNoCommonValue: next.hasNoCommonValue,
        unlinked: next.unlinked,
      });
      if (!row.edited) {
        this.setFormValue(row);
      }
      rows.push(row);
    }

    this.rows.set(rows);
    this.cdr.markForCheck();
  }

  /** Replace the value that the user entered with the suggested value */
  useSuggestion(entity: AffectedEntity): void {
    entity.edited = false;
    entity.suggestionChanged = false;
    this.setFormValue(entity);
    this.changeCount++;
    this.recalculating.set(true);
    this.valueChanged.next();
  }

  private setFormValue(entity: AffectedEntity): void {
    // without notifying the form, as it is not a change of the user
    entity.form.formGroup.controls[entity.targetFieldId].setValue(
      this.entitySchemaService.valueToEntityFormat(
        entity.newValue,
        entity.selectedField,
      ),
      { emitEvent: false },
    );
  }

  onConfirm(): void {
    const rows = this.rows();
    for (const entity of rows) {
      const fieldId = entity.targetFieldId;
      const formControl = entity.form?.formGroup.controls[fieldId];
      if (formControl) {
        entity.newValue = formControl.value;
      }
    }
    this.dialogRef.close(rows);
  }
}
