import { Component, computed } from "@angular/core";
import { ViewDirective } from "#src/app/core/entity/default-datatype/view.directive";
import { DynamicComponent } from "#src/app/core/config/dynamic-components/dynamic-component.decorator";
import { DynamicComponentDirective } from "#src/app/core/config/dynamic-components/dynamic-component.directive";
import { FormFieldConfig } from "#src/app/core/common-components/entity-form/FormConfig";
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
  /** the embedded (outer) field holding the entries, e.g. "contactPersons" */
  outerProp: string;
  /** the inner properties of the entries that reference the parent, e.g. ["user"] */
  linkProps: string[];
  /** the inner field to display, extended with its view component */
  innerField: FormFieldConfig;
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
            config: { value: value, formFieldConfig: field },
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
  readonly innerField = computed(() => this.config()?.innerField);

  /** the values of the inner field in all entries that reference the parent entity */
  readonly values = computed<unknown[]>(() => {
    const config = this.config();
    const parentId = config?.relatedEntitiesParent?.getId();
    const entity = this.entity();
    if (!config?.innerField || !parentId || !entity) {
      return [];
    }

    const entries: Record<string, unknown>[] = asArray(
      entity[config.outerProp] ?? [],
    );

    return entries
      .filter((entry) =>
        config.linkProps.some((prop) =>
          asArray(entry?.[prop] ?? []).includes(parentId),
        ),
      )
      .map((entry) => entry[config.innerField.id])
      .filter((value) => !isEmptyValue(value));
  });
}
