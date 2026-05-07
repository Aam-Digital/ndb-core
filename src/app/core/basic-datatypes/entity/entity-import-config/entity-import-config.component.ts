import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from "@angular/core";
import { ColumnMapping } from "../../../import/column-mapping";
import { EntityConstructor } from "../../../entity/model/entity";
import { ImportAdditionalSettings } from "../../../import/import-additional-settings/import-additional-settings.component";
import { EntityRegistry } from "../../../entity/database-entity.decorator";
import { MatSelectModule } from "@angular/material/select";
import { MatFormFieldModule } from "@angular/material/form-field";
import { FormsModule } from "@angular/forms";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { MatTooltip } from "@angular/material/tooltip";
import { HintBoxComponent } from "../../../common-components/hint-box/hint-box.component";
import { DynamicComponentDirective } from "../../../config/dynamic-components/dynamic-component.directive";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";
import {
  EntityAdditional,
  normalizeEntityAdditional,
} from "../entity.datatype";
import { isInheritanceSourceReferenceField } from "../../../import/import-inheritance-warning.util";
import { EntitySchemaService } from "../../../entity/schema/entity-schema.service";

/**
 * Inline import configuration component for entity reference fields.
 * Lets users select which property of the referenced entity to match against import values,
 * and optionally configure a value transformation for that property.
 */
@DynamicComponent("EntityImportConfig")
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-entity-import-config",
  templateUrl: "./entity-import-config.component.html",
  imports: [
    MatSelectModule,
    MatFormFieldModule,
    FormsModule,
    FaIconComponent,
    MatTooltip,
    HintBoxComponent,
    DynamicComponentDirective,
  ],
})
export class EntityImportConfigComponent {
  private readonly entityRegistry = inject(EntityRegistry);
  private readonly schemaService = inject(EntitySchemaService);

  col = input<ColumnMapping>();
  rawData = input<any[]>([]);
  entityType = input<EntityConstructor>();
  otherColumnMappings = input<ColumnMapping[]>([]);
  additionalSettings = input<ImportAdditionalSettings>();
  onColumnMappingChange = input<(col: ColumnMapping) => void>();

  selectedRefField = computed(() => {
    const col = this.col();
    const current = normalizeEntityAdditional(col?.additional);
    return current?.refField ?? "";
  });

  referencedEntity = computed<EntityConstructor | null>(() => {
    const col = this.col();
    const entityType = this.entityType();
    if (!col?.propertyName || !entityType) return null;

    const fieldSchema = entityType.schema.get(col.propertyName);
    const entityName = fieldSchema?.additional;
    if (!entityName) return null;

    return this.entityRegistry.get(entityName) ?? null;
  });

  availableProperties = computed(() => {
    const entity = this.referencedEntity();
    if (!entity) return [];
    return [...entity.schema.entries()]
      .filter(
        ([prop, schema]) =>
          (!!schema.label && !schema.isInternalField) || prop === "_id",
      )
      .map(([prop, schema]) => ({
        label: schema.label ?? prop,
        property: prop,
      }));
  });

  showInheritanceHint = computed(() => {
    const col = this.col();
    const entityType = this.entityType();
    if (!col?.propertyName || !entityType) return false;
    return isInheritanceSourceReferenceField(entityType, col.propertyName);
  });

  hasMultiMapping = computed(() => {
    const col = this.col();
    const otherColumnMappings = this.otherColumnMappings();
    return (
      col?.propertyName !== undefined &&
      otherColumnMappings?.some(
        (m) => m.propertyName === col.propertyName && m.column !== col.column,
      )
    );
  });

  /** Config for the sub-field's inline component (for value transformation config) */
  subFieldInlineConfig = computed(() => {
    const refField = this.selectedRefField();
    const refEntity = this.referencedEntity();
    if (!refField || !refEntity) return null;

    const refFieldSchema = refEntity.schema.get(refField);
    if (!refFieldSchema) return null;

    const refDatatype = this.schemaService.getDatatypeOrDefault(
      refFieldSchema.dataType,
    );
    if (!refDatatype?.importConfigComponent) return null;

    const col = this.col();
    const additional = col?.additional as EntityAdditional;
    // Synthetic column mapping for the sub-field's inline component
    const syntheticCol: ColumnMapping = {
      column: col.column,
      propertyName: refField,
      additional: additional?.valueMapping,
    };

    return {
      component: refDatatype.importConfigComponent,
      config: {
        col: syntheticCol,
        rawData: this.rawData(),
        entityType: refEntity,
        otherColumnMappings: [],
        additionalSettings: this.additionalSettings(),
        onColumnMappingChange: (updatedCol: ColumnMapping) => {
          const current = normalizeEntityAdditional(col.additional) ?? {
            refField: refField,
          };
          const updatedParentCol: ColumnMapping = {
            ...col,
            additional: {
              ...current,
              refField: refField,
              valueMapping: updatedCol.additional,
            } as EntityAdditional,
          };
          this.onColumnMappingChange()?.(updatedParentCol);
        },
      },
    };
  });

  onRefFieldChange(newRefField: string) {
    const col = this.col();
    // Clear valueMapping when ref field changes
    this.onColumnMappingChange()?.({
      ...col,
      additional: { refField: newRefField } as EntityAdditional,
    });
  }
}
