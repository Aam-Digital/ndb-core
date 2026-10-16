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
} from "@angular/core";
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
import { uniq } from "lodash-es";
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
}

/** The change that opened the update dialog */
export interface UpdateTrigger {
  /** The changed entity */
  entity: Entity;

  /** The changed entity before the change (the same as entity if there is no change) */
  before: Entity;
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
  }>(MAT_DIALOG_DATA);
  private dialogRef =
    inject<MatDialogRef<AutomatedFieldUpdateComponent>>(MatDialogRef);
  private readonly entityFormService = inject(EntityFormService);
  private readonly entitySchemaService = inject(EntitySchemaService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  entityConstructor: EntityConstructor;

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
    for (const entity of this.data.entities) {
      const fieldId = entity.targetFieldId;
      const entityConstructor = entity.targetEntityType;

      entity.selectedField = this.entityFormService.extendFormFieldConfig(
        fieldId,
        entityConstructor,
      );

      const entityForm = await this.entityFormService.createEntityForm(
        [fieldId],
        entity.affectedEntity,
        this.destroyRef,
      );

      entity.form = entityForm;

      const formattedValue = this.entitySchemaService.valueToEntityFormat(
        entity.newValue,
        entity.selectedField,
      );
      entity.form.formGroup.controls[fieldId].setValue(formattedValue);
    }
    this.cdr.markForCheck();
  }

  onConfirm(): void {
    for (const entity of this.data.entities) {
      const fieldId = entity.targetFieldId;
      const formControl = entity.form?.formGroup.controls[fieldId];
      if (formControl) {
        entity.newValue = formControl.value;
      }
    }
    this.dialogRef.close(this.data.entities);
  }
}
