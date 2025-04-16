import { Component, Inject, OnInit } from "@angular/core";
import { MatButton } from "@angular/material/button";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { EntityBlockComponent } from "app/core/basic-datatypes/entity/entity-block/entity-block.component";
import { DialogCloseComponent } from "app/core/common-components/dialog-close/dialog-close.component";
import { EntityFieldEditComponent } from "app/core/common-components/entity-field-edit/entity-field-edit.component";
import {
  EntityForm,
  EntityFormService,
} from "app/core/common-components/entity-form/entity-form.service";
import { FormFieldConfig } from "app/core/common-components/entity-form/FormConfig";
import { Entity, EntityConstructor } from "app/core/entity/model/entity";

export interface AffectedEntity {
  id: string;
  newStatus: string;
  targetField: string;
  targetEntityType: EntityConstructor;
  form?: EntityForm<Entity>;
  selectedField?: FormFieldConfig;
  affectedEntity?: Entity;
  mappedProperty: string;
}

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
  entityConstructor: EntityConstructor;
  entityForm: EntityForm<Entity>;
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { entities: AffectedEntity[] },
    private dialogRef: MatDialogRef<AutomatedStatusUpdateComponent>,
    private entityFormService: EntityFormService,
  ) {}

  async ngOnInit(): Promise<void> {
    await Promise.all(
      this.data.entities.map(async (entity) => {
        const fieldId = entity.targetField;
        const entityConstructor = entity.targetEntityType;
        entity.selectedField = this.entityFormService.extendFormFieldConfig(
          fieldId,
          entityConstructor,
        );

        entity.affectedEntity = new entityConstructor();
        const entityForm = await this.entityFormService.createEntityForm(
          [fieldId],
          entity.affectedEntity,
        );

        entity.form = entityForm;
        entity.form.formGroup.controls[fieldId].setValue(entity.newStatus);
      }),
    );
  }

  onConfirm(): void {
    for (const entity of this.data.entities) {
      const fieldId = entity.targetField;
      const formControl = entity.form?.formGroup.controls[fieldId];
      if (formControl) {
        entity.newStatus = formControl.value;
      }
    }
    this.dialogRef.close(this.data.entities);
  }
}
