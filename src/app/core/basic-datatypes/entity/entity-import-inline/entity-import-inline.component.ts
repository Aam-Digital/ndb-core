import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  computed,
  inject,
  signal,
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
@DynamicComponent("EntityImportInline")
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-entity-import-inline",
  templateUrl: "./entity-import-inline.component.html",
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
export class EntityImportInlineComponent implements OnChanges {
  private entityRegistry = inject(EntityRegistry);
  private schemaService = inject(EntitySchemaService);

  @Input() col: ColumnMapping;
  @Input() rawData: any[] = [];
  @Input() entityType: EntityConstructor;
  @Input() otherColumnMappings: ColumnMapping[] = [];
  @Input() additionalSettings: ImportAdditionalSettings;
  @Input() onColumnMappingChange: (col: ColumnMapping) => void;

  referencedEntity = signal<EntityConstructor | null>(null);
  availableProperties = signal<{ property: string; label: string }[]>([]);
  selectedRefField = signal<string>("");
  showInheritanceHint = signal(false);

  hasMultiMapping = computed(
    () =>
      this.col?.propertyName !== undefined &&
      this.otherColumnMappings?.some(
        (m) =>
          m.propertyName === this.col.propertyName &&
          m.column !== this.col.column,
      ),
  );

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

    const additional = this.col?.additional as EntityAdditional;
    // Synthetic column mapping for the sub-field's inline component
    const syntheticCol: ColumnMapping = {
      column: this.col.column,
      propertyName: refField,
      additional: additional?.valueMapping,
    };

    return {
      component: refDatatype.importConfigComponent,
      config: {
        col: syntheticCol,
        rawData: this.rawData,
        entityType: refEntity,
        otherColumnMappings: [],
        additionalSettings: this.additionalSettings,
        onColumnMappingChange: (updatedCol: ColumnMapping) => {
          const current = normalizeEntityAdditional(this.col.additional) ?? {
            refField: refField,
          };
          this.col.additional = {
            ...current,
            refField: refField,
            valueMapping: updatedCol.additional,
          } as EntityAdditional;
          this.onColumnMappingChange?.(this.col);
        },
      },
    };
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["col"] || changes["entityType"]) {
      this.initFromInputs();
    }
  }

  private initFromInputs() {
    if (!this.col?.propertyName || !this.entityType) return;

    this.showInheritanceHint.set(
      isInheritanceSourceReferenceField(this.entityType, this.col.propertyName),
    );

    const fieldSchema = this.entityType.schema.get(this.col.propertyName);
    const entityName = fieldSchema?.additional;
    if (!entityName) return;

    const entity = this.entityRegistry.get(entityName);
    this.referencedEntity.set(entity ?? null);

    if (entity) {
      const props = [...entity.schema.entries()]
        .filter(
          ([prop, schema]) =>
            (!!schema.label && !schema.isInternalField) || prop === "_id",
        )
        .map(([prop, schema]) => ({
          label: schema.label ?? prop,
          property: prop,
        }));
      this.availableProperties.set(props);
    }

    const current = normalizeEntityAdditional(this.col.additional);
    this.selectedRefField.set(current?.refField ?? "");
  }

  onRefFieldChange(newRefField: string) {
    this.selectedRefField.set(newRefField);
    // Clear valueMapping when ref field changes
    this.col.additional = { refField: newRefField } as EntityAdditional;
    this.onColumnMappingChange?.(this.col);
  }
}
