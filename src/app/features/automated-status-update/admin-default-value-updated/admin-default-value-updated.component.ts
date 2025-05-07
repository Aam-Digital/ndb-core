import {
  Component,
  inject,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatOption, MatSelect } from "@angular/material/select";
import { MatButton } from "@angular/material/button";
import { MatTooltip } from "@angular/material/tooltip";
import { EntityFieldLabelComponent } from "../../../core/common-components/entity-field-label/entity-field-label.component";
import { CustomFormControlDirective } from "../../../core/common-components/basic-autocomplete/custom-form-control.directive";
import { DefaultValueConfigUpdatedFromReferencingEntity } from "../default-value-config-updated-from-referencing-entity";
import { EntityConstructor } from "../../../core/entity/model/entity";
import { EntitySchemaField } from "../../../core/entity/schema/entity-schema-field";
import { EntitySchemaService } from "../../../core/entity/schema/entity-schema.service";
import { EntityRegistry } from "../../../core/entity/database-entity.decorator";
import { MatDialog } from "@angular/material/dialog";
import {
  AutomatedFieldMappingComponent,
  AutomatedFieldMappingDialogData,
} from "../automated-field-mapping/automated-field-mapping.component";
import { lastValueFrom } from "rxjs";
import { MatFormFieldControl } from "@angular/material/form-field";
import { EntityRelationsService } from "app/core/entity/entity-mapper/entity-relations.service";

@Component({
  selector: "app-admin-default-value-updated",
  imports: [
    MatSelect,
    MatButton,
    ReactiveFormsModule,
    MatTooltip,
    MatOption,
    EntityFieldLabelComponent,
    FormsModule,
  ],
  templateUrl: "./admin-default-value-updated.component.html",
  styleUrl: "./admin-default-value-updated.component.scss",
  providers: [
    {
      provide: MatFormFieldControl,
      useExisting: AdminDefaultValueUpdatedComponent,
    },
  ],
})
export class AdminDefaultValueUpdatedComponent
  extends CustomFormControlDirective<DefaultValueConfigUpdatedFromReferencingEntity>
  implements OnInit, OnChanges
{
  @Input() entityType: EntityConstructor;
  @Input() entitySchemaField: EntitySchemaField;

  private readonly entityRelationsService = inject(EntityRelationsService);
  private readonly entitySchemaService = inject(EntitySchemaService);
  private readonly entityRegistry = inject(EntityRegistry);
  private readonly matDialog = inject(MatDialog);

  relatedEntityType: any;

  availableRelatedEntities: {
    label: string;
    entityType: string;
    relatedReferenceFields: string[];
  }[];

  ngOnInit() {
    this.relatedEntityType = this.value?.relatedEntityType;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.entityType) {
      this.availableRelatedEntities =
        this.updateAvailableRelatedEntityForAutomated(
          this.entityType.ENTITY_TYPE,
        );
    }
  }

  onEntityTypeSelected(newEntityType: any) {
    this.relatedEntityType = newEntityType;

    // show the dialog immediately, so that the user completes all necessary configuration
    this.openAutomatedMappingDialog(newEntityType);
  }

  async openAutomatedMappingDialog(selectedEntity: string) {
    const relatedEntityDetails = this.availableRelatedEntities.find(
      (r) => r.entityType === selectedEntity,
    );

    // add editComponent (because we cannot rely on the entity's schema yet for a new field)
    this.entitySchemaField.editComponent =
      this.entitySchemaField.editComponent ??
      this.entitySchemaService.getComponent(this.entitySchemaField, "edit");

    const refEntity = this.entityRegistry.get(selectedEntity);
    const dialogRef = this.matDialog.open(AutomatedFieldMappingComponent, {
      data: {
        currentEntityType: this.entityType,
        relatedEntityType: refEntity,
        currentField: this.entitySchemaField,
        relatedReferenceFields: relatedEntityDetails.relatedReferenceFields,
      } as AutomatedFieldMappingDialogData,
    });

    const result = await lastValueFrom(dialogRef.afterClosed());
    if (result) {
      this.value = {
        relatedReferenceField: result.relatedReferenceField,
        relatedEntityType: selectedEntity,
        relatedTriggerField: result.relatedTriggerField,
        automatedMapping: result.automatedMapping,
      };
    }
  }

  /**
   * Returns a list of related entities with reference info for the given entity type.
   * Used in automated rule configuration.
   */
  private updateAvailableRelatedEntityForAutomated(entityType: string): {
    label: string;
    entityType: string;
    relatedReferenceFields: string[];
  }[] {
    const relatedEntities =
      this.entityRelationsService.getEntityTypesReferencingType(entityType);
    return relatedEntities
      .filter((refType) => !!refType.entityType.label)
      .map((refType) => ({
        label: refType.entityType.label,
        entityType: refType.entityType.ENTITY_TYPE,
        relatedReferenceFields: refType.referencingProperties.map((p) => p.id),
      }));
  }
}
