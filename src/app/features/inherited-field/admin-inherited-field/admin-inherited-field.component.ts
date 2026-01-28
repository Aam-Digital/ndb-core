import { Component, inject, Input, OnInit } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatButton } from "@angular/material/button";
import { MatDialog } from "@angular/material/dialog";
import { MatFormFieldControl } from "@angular/material/form-field";
import { MatTooltip } from "@angular/material/tooltip";
import { EntityRelationsService } from "app/core/entity/entity-mapper/entity-relations.service";
import { lastValueFrom } from "rxjs";
import { CustomFormControlDirective } from "../../../core/common-components/basic-autocomplete/custom-form-control.directive";
import { EntityRegistry } from "../../../core/entity/database-entity.decorator";
import { EntityConstructor } from "../../../core/entity/model/entity";
import { EntitySchemaField } from "../../../core/entity/schema/entity-schema-field";
import {
  AutomatedFieldMappingComponent,
  AutomatedFieldMappingDialogData,
} from "#src/app/features/inherited-field/automated-field-update/automated-field-mapping/automated-field-mapping.component";
import { DefaultValueConfigInheritedField } from "../inherited-field-config";
import { EntityReferenceFieldSelectorComponent } from "#src/app/entity-reference-field-selector/entity-reference-field-selector.component";

interface InheritanceOption {
  type: "inherit" | "automated";
  label: string;
  labelParts: { entityName: string; fieldName: string };
  tooltip: string;
  sourceReferenceField?: string;
  sourceReferenceEntity?: string;
  referencedEntityType?: EntityConstructor;
}

@Component({
  selector: "app-admin-inherited-field",
  imports: [
    MatButton,
    ReactiveFormsModule,
    MatTooltip,
    FormsModule,
    EntityReferenceFieldSelectorComponent,
  ],
  templateUrl: "./admin-inherited-field.component.html",
  styleUrl: "./admin-inherited-field.component.scss",
  providers: [
    {
      provide: MatFormFieldControl,
      useExisting: AdminInheritedFieldComponent,
    },
  ],
})
export class AdminInheritedFieldComponent
  extends CustomFormControlDirective<DefaultValueConfigInheritedField>
  implements OnInit
{
  @Input() entityType: EntityConstructor;
  @Input() entitySchemaField: EntitySchemaField;

  private readonly matDialog = inject(MatDialog);

  ngOnInit() {
    if (!this.value) {
      this.value = {
        sourceReferenceField: "",
        sourceValueField: "",
      };
    }
  }

  onOptionSelected(option: any) {
    // Update value and open dialog as before
    const previousValue = this.value;
    this.value = {
      ...this.value,
      sourceReferenceField: option.sourceReferenceField,
      sourceReferenceEntity: option.sourceReferenceEntity,
    };
    this.openConfigDetailsDialog(option).then((confirmed) => {
      if (!confirmed) {
        // revert selection
        this.value = previousValue;
      }
    });
  }

  async openConfigDetailsDialog(option: any = null): Promise<boolean> {
    if (!option?.sourceReferenceField) return false;
    const dialogRef = this.matDialog.open<
      AutomatedFieldMappingComponent,
      AutomatedFieldMappingDialogData,
      DefaultValueConfigInheritedField
    >(AutomatedFieldMappingComponent, {
      data: {
        currentEntityType: this.entityType,
        currentField: this.entitySchemaField,
        sourceValueEntityType: option.referencedEntityType,
        value: {
          ...this.value,
          sourceReferenceField: option.sourceReferenceField,
          sourceReferenceEntity: option.sourceReferenceEntity,
        },
      },
    });
    const result = await lastValueFrom(dialogRef.afterClosed());
    if (result?.sourceValueField) {
      this.value = result;
      return true;
    } else {
      return false;
    }
  }
}
