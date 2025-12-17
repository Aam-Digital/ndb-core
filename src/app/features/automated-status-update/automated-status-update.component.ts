import { EntityForm } from "#src/app/core/common-components/entity-form/entity-form";
import { EntityFieldEditComponent } from "#src/app/core/entity/entity-field-edit/entity-field-edit.component";
import { Component, inject, OnInit } from "@angular/core";
import { MatButton } from "@angular/material/button";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { EntityBlockComponent } from "app/core/basic-datatypes/entity/entity-block/entity-block.component";
import { DialogCloseComponent } from "app/core/common-components/dialog-close/dialog-close.component";
import { EntityFormService } from "app/core/common-components/entity-form/entity-form.service";
import { FormFieldConfig } from "app/core/common-components/entity-form/FormConfig";
import { Entity, EntityConstructor } from "app/core/entity/model/entity";

/**
 * Represents an entity that will be affected by a status update.
 * This interface is used to define the structure of the data
 * that will be passed to the
 * AutomatedStatusUpdateComponent for processing.
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

  form?: EntityForm<Entity>;
  selectedField?: FormFieldConfig;
}

/**
 * A confirmation dialog for the user to review and confirm
 * the automated updates of fields in related entities,
 * after a triggering entity has been updated.
 *
 * (also see AutomatedStatusUpdateConfigService)
 */
@Component({
  selector: "app-automated-status-update",
  imports: [
    DialogCloseComponent,
    EntityFieldEditComponent,
    EntityBlockComponent,
    MatButton,
    MatDialogModule,
  ],
  templateUrl: "./automated-status-update.component.html",
  styleUrl: "./automated-status-update.component.scss",
})
export class AutomatedStatusUpdateComponent implements OnInit {
  data = inject<{
    entities: AffectedEntity[];
  }>(MAT_DIALOG_DATA);
  private dialogRef =
    inject<MatDialogRef<AutomatedStatusUpdateComponent>>(MatDialogRef);
  private entityFormService = inject(EntityFormService);

  entityConstructor: EntityConstructor;

  async ngOnInit(): Promise<void> {
    for (const entity of this.data.entities) {
      const fieldId = entity.targetFieldId;
      const entityConstructor = entity.targetEntityType;

      entity.selectedField = this.entityFormService.extendFormFieldConfig(
        fieldId,
        entityConstructor,
      );

      // todo: check if we reallly need this? also not sure why we create a new entity here
      if (!entity.affectedEntity) {
        entity.affectedEntity = new entityConstructor();
      }
      const entityForm = await this.entityFormService.createEntityForm(
        [fieldId],
        entity.affectedEntity,
      );

      entity.form = entityForm;
      entity.form.formGroup.controls[fieldId].setValue(entity.newValue);
    }
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
