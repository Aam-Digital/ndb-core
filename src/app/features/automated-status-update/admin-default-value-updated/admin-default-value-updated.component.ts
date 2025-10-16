import {
  Component,
  inject,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatButton } from "@angular/material/button";
import { MatDialog } from "@angular/material/dialog";
import { MatFormFieldControl } from "@angular/material/form-field";
import { MatOption, MatSelect } from "@angular/material/select";
import { MatTooltip } from "@angular/material/tooltip";
import { EntityRelationsService } from "app/core/entity/entity-mapper/entity-relations.service";
import { lastValueFrom } from "rxjs";
import { CustomFormControlDirective } from "../../../core/common-components/basic-autocomplete/custom-form-control.directive";
import { EntityRegistry } from "../../../core/entity/database-entity.decorator";
import { EntityFieldLabelComponent } from "../../../core/entity/entity-field-label/entity-field-label.component";
import { EntityConstructor } from "../../../core/entity/model/entity";
import { EntitySchemaField } from "../../../core/entity/schema/entity-schema-field";
import { EntitySchemaService } from "../../../core/entity/schema/entity-schema.service";
import {
  AutomatedFieldMappingComponent,
  AutomatedFieldMappingDialogData,
} from "../automated-field-mapping/automated-field-mapping.component";
import { DefaultValueConfigUpdatedFromReferencingEntity } from "../default-value-config-updated-from-referencing-entity";

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
