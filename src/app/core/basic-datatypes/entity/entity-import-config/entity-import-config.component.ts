import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from "@angular/core";
import { ColumnMapping } from "../../../import/column-mapping";
import { EntityConstructor } from "../../../entity/model/entity";
import { ImportAdditionalSettings } from "../../../import/import-additional-settings";
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
import { asArray } from "../../../../utils/asArray";

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

  /**
   * All entity types this column's target field allows referencing.
   * Normally a single type, but a field can allow linking to several record
   * types, in which case the schema's `additional` is an array rather than a
   * single type name - each is resolved individually here (an unregistered
   * type is skipped rather than throwing, since `EntityRegistry.get()` only
   * accepts one registered key at a time).
   */
  referencedEntities = computed<EntityConstructor[]>(() => {
    const col = this.col();
    const entityType = this.entityType();
    if (!col?.propertyName || !entityType) return [];

    const fieldSchema = entityType.schema.get(col.propertyName);
    return asArray(fieldSchema?.additional)
      .filter((entityName) => this.entityRegistry.has(entityName))
      .map((entityName) => this.entityRegistry.get(entityName));
  });

  /**
   * The allowed type that declares the currently selected match property.
   *
   * With several allowed types the selected property may exist on only one of
   * them, so the value-transformation config has to be built from that type's
   * schema rather than from an arbitrary (e.g. the first) one.
   */
  selectedRefFieldEntity = computed<EntityConstructor | null>(() => {
    const refField = this.selectedRefField();
    if (!refField) return null;

    return (
      this.referencedEntities().find((entity) => entity.schema.has(refField)) ??
      null
    );
  });

  /** Display label for the "Match by ... property" dropdown, joining every allowed type's label. */
  referencedEntityLabel = computed(() =>
    this.referencedEntities()
      // a type configured without a label falls back to its id, as elsewhere
      .map((entity) => entity.label ?? entity.ENTITY_TYPE)
      .join(" / "),
  );

  /**
   * The union of matchable properties across every allowed referenced type,
   * so a multi-type field still offers a full "match by" property list
   * instead of only the first type's properties.
   *
   * Properties sharing an id across several types are deliberately collapsed
   * into one entry: matching compares that same property on candidates of
   * every allowed type (see `EntityDatatype.importMatchField`), so offering it
   * once matches against all of them. `typeHint` then names every type that
   * declares it, so users can tell a shared property from one that only
   * narrows the match to a single type. It stays empty for a single-type
   * field, where naming the one allowed type would just be noise.
   */
  availableProperties = computed(() => {
    const referencedEntities = this.referencedEntities();
    const isMultiType = referencedEntities.length > 1;
    const properties = new Map<
      string,
      { property: string; label: string; declaringTypes: string[] }
    >();

    for (const entity of referencedEntities) {
      const entityLabel = entity.label ?? entity.ENTITY_TYPE;

      for (const [prop, schema] of entity.schema.entries()) {
        if (!((!!schema.label && !schema.isInternalField) || prop === "_id"))
          continue;

        const existing = properties.get(prop);
        if (existing) {
          existing.declaringTypes.push(entityLabel);
          continue;
        }

        properties.set(prop, {
          property: prop,
          label: schema.label ?? prop,
          declaringTypes: [entityLabel],
        });
      }
    }

    return [...properties.values()].map(
      ({ property, label, declaringTypes }) => ({
        property,
        label,
        typeHint: isMultiType ? declaringTypes.join(", ") : "",
      }),
    );
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
    const refEntity = this.selectedRefFieldEntity();
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
