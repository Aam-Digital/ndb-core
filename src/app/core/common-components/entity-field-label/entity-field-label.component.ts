import { Component, Signal, computed, inject, input } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { MatTooltipModule } from "@angular/material/tooltip";
import { AdminEntityService } from "../../admin/admin-entity.service";
import { EntityRegistry } from "../../entity/database-entity.decorator";
import { EntityConstructor } from "../../entity/model/entity";
import {
  ColumnConfig,
  FormFieldConfig,
  toFormFieldConfig,
} from "../entity-form/FormConfig";
import { EntityFormService } from "../entity-form/entity-form.service";

/**
 * Generic component to display the label of one form field of an entity
 * without having to handle overwriting the field config with potentially missing schema field details.
 */
@Component({
  selector: "app-entity-field-label",
  templateUrl: "./entity-field-label.component.html",
  imports: [MatTooltipModule],
})
export class EntityFieldLabelComponent {
  private readonly entityFormService = inject(EntityFormService);
  private readonly entityRegistry = inject(EntityRegistry);
  private readonly adminEntityService = inject(AdminEntityService);

  private schemaUpdateSignal: Signal<void> = toSignal(
    this.adminEntityService.entitySchemaUpdated,
    {
      initialValue: null,
    },
  );

  /**
   * field id or full config
   */
  field: Signal<ColumnConfig> = input.required();

  /**
   * entity type to look up the schema details for the given field
   */
  entityType: Signal<EntityConstructor | undefined> = input(undefined, {
    transform: (value: EntityConstructor | string | undefined) => {
      if (!value) {
        return undefined;
      }
      if (typeof value === "string") {
        return this.entityRegistry.get(value);
      }
      return value;
    }
  });

  /**
   * Custom columns in addition to the entity type's schema
   */
  additionalFields: Signal<ColumnConfig[]> = input([], {
    transform: (value: ColumnConfig[] | undefined) => value ?? [],
  });

  /**
   * full field config extended from schema (used internally and for template)
   */
  _field: Signal<FormFieldConfig> = computed(() => {
    this.schemaUpdateSignal(); // re-evaluate when schema updates

    if (!this.entityType()) {
      return undefined;
    }

    const customFieldConfig: ColumnConfig = this.additionalFields().find(
      (col) => toFormFieldConfig(col).id === this.field(),
    );

    return this.entityFormService.extendFormFieldConfig(
      customFieldConfig ?? this.field(),
      this.entityType(),
    );
  });
}
