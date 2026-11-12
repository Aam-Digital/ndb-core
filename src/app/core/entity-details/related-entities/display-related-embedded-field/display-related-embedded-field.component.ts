import { Component, computed, inject } from "@angular/core";
import { ViewDirective } from "#src/app/core/entity/default-datatype/view.directive";
import { DynamicComponent } from "#src/app/core/config/dynamic-components/dynamic-component.decorator";
import { DynamicComponentDirective } from "#src/app/core/config/dynamic-components/dynamic-component.directive";
import { FormFieldConfig } from "#src/app/core/common-components/entity-form/FormConfig";
import { EntitySchemaService } from "#src/app/core/entity/schema/entity-schema.service";
import {
  getEmbeddedEntityReferenceFields,
  resolveEmbeddedField,
} from "#src/app/core/entity/schema/embedded-schema-field.util";
import { Entity } from "#src/app/core/entity/model/entity";
import { asArray } from "#src/app/utils/asArray";
import { isEmptyValue } from "#src/app/utils/is-empty-value";

/**
 * Config of the {@link DisplayRelatedEmbeddedFieldComponent},
 * set by the {@link RelatedEntitiesComponent} for its columns.
 */
export interface RelatedEmbeddedFieldConfig {
  /** the entity whose details view shows the related records (e.g. the User) */
  relatedEntitiesParent?: Entity;
}

/**
 * Display a property of the embedded entries (e.g. of a `schema-embed-array` field)
 * that link the record of the row to the entity of the details view.
 *
 * For example, a School has a field "contactPersons" with entries `{ user, role }`:
 * in the related Schools of a User, the column "contactPersons.role" shows
 * the role of that User at each School (and not the roles of other contact persons).
 *
 * The {@link RelatedEntitiesComponent} uses this for column ids of the form "outerField.innerField".
 */
@DynamicComponent("DisplayRelatedEmbeddedField")
@Component({
  selector: "app-display-related-embedded-field",
  imports: [DynamicComponentDirective],
  template: `
    @if (innerField(); as field) {
      @for (value of values(); track $index) {
        @if (!$first) {
          <span>, </span>
        }
        <ng-container
          [appDynamicComponent]="{
            component: field.viewComponent,
            config: {
              value: value,
              id: field.id,
              entity: entity(),
              formFieldConfig: field,
            },
          }"
        ></ng-container>
      }
    }
  `,
})
export class DisplayRelatedEmbeddedFieldComponent extends ViewDirective<
  unknown,
  RelatedEmbeddedFieldConfig
> {
  private readonly schemaService = inject(EntitySchemaService);

  private readonly embeddedField = computed(() => {
    const entityCtr = this.entity()?.getConstructor();
    const id = this.id();
    if (!entityCtr || !id) {
      return undefined;
    }
    return resolveEmbeddedField(this.schemaService, entityCtr, id);
  });

  /** the inner field, extended with its view component */
  readonly innerField = computed<FormFieldConfig | undefined>(() => {
    const ref = this.embeddedField();
    if (!ref) {
      return undefined;
    }
    return this.schemaService.addSchemaToFormField(
      { id: ref.innerProp },
      ref.innerSchema,
    );
  });

  /** the values of the inner field in all entries that reference the parent entity */
  readonly values = computed<unknown[]>(() => {
    const ref = this.embeddedField();
    const parentId = this.config()?.relatedEntitiesParent?.getId();
    const entity = this.entity();
    if (!ref || !parentId || !entity) {
      return [];
    }

    const referenceProps = getEmbeddedEntityReferenceFields(
      this.schemaService,
      ref.outerSchema,
    ).map(([innerProp]) => innerProp);
    const entries: Record<string, unknown>[] = asArray(
      entity[ref.outerProp] ?? [],
    );

    return entries
      .filter((entry) =>
        referenceProps.some((prop) =>
          asArray(entry?.[prop] ?? []).includes(parentId),
        ),
      )
      .map((entry) => entry[ref.innerProp])
      .filter((value) => !isEmptyValue(value));
  });
}
