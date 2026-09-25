import { EntityForm } from "#src/app/core/common-components/entity-form/entity-form";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { EntitySchemaService } from "app/core/entity/schema/entity-schema.service";
import { InheritedValueButtonComponent } from "../../../features/inherited-field/inherited-value-button/inherited-value-button.component";
import { EntityFormService } from "../../common-components/entity-form/entity-form.service";
import {
  ColumnConfig,
  FormFieldConfig,
  toFormFieldConfig,
} from "../../common-components/entity-form/FormConfig";
import { ErrorHintComponent } from "../../common-components/error-hint/error-hint.component";
import { HelpButtonComponent } from "../../common-components/help-button/help-button.component";
import { EntityFieldViewComponent } from "../entity-field-view/entity-field-view.component";
import { Entity } from "../model/entity";
import { DynamicEditComponent } from "./dynamic-edit/dynamic-edit.component";

/**
 * Generic component to display one entity property field's editComponent.
 *
 * Dynamically extends field details from entity schema and
 * loads the relevant, specific EditComponent implementation.
 *
 * For viewComponent of a field, see EntityFieldViewComponent.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-entity-field-edit",
  templateUrl: "./entity-field-edit.component.html",
  styleUrls: ["./entity-field-edit.component.scss"],
  imports: [
    HelpButtonComponent,
    EntityFieldViewComponent,
    InheritedValueButtonComponent,
    FontAwesomeModule,
    MatButtonModule,
    MatTooltipModule,
    DynamicEditComponent,
    ReactiveFormsModule,
    MatFormFieldModule,
    ErrorHintComponent,
  ],
})
export class EntityFieldEditComponent<T extends Entity = Entity> {
  private entityFormService = inject(EntityFormService);
  private entitySchemaService = inject(EntitySchemaService);

  /** field id or full config */
  field = input<ColumnConfig>();

  entity = input<T>();
  form = input<EntityForm<T>>();

  /**
   * Alternative to `form`: a bare FormGroup to use when only a field's own local form context
   * is available (e.g. one row of an embedded table edited outside the entity form lifecycle),
   * without the wider EntityForm context (`entity`, `fieldConfigs`, `inheritedParentValues`, ...).
   *
   * Side effect: since that wider context is required to inherit/default values, the inherit
   * value button is never shown for this field while only `formGroup` is set, regardless of
   * `hideInheritButton`. If both `form` and `formGroup` are set, `form` takes precedence.
   */
  formGroup = input<FormGroup>();

  /** Whether to display the field in a limited space, hiding details like the help description button. */
  compactMode = input<boolean>();

  /** Whether to display the field label or not. */
  hideLabel = input<boolean>();

  /** Whether to hide the inherit value button for inherited-field default values. */
  hideInheritButton = input<boolean>(false);

  /** full field config extended from schema */
  readonly _field = computed<FormFieldConfig | undefined>(() => {
    const field = this.field();
    if (!field) return undefined;
    const entity = this.entity();
    if (entity?.getConstructor()) {
      return this.entityFormService.extendFormFieldConfig(
        field,
        entity.getConstructor(),
      );
    }
    // copy, so that the given config (which may come from the app config) is not changed here
    const result = { ...toFormFieldConfig(field) };
    // add editComponent (because we cannot rely on the entity's schema yet for a new field)
    result.editComponent =
      result.editComponent ??
      this.entitySchemaService.getComponent(result, "edit");
    return result;
  });

  /** The FormGroup to actually use, from whichever of `form`/`formGroup` was set. */
  readonly effectiveFormGroup = computed<FormGroup | undefined>(
    () => this.form()?.formGroup ?? this.formGroup(),
  );

  readonly formControl = computed<FormControl | null>(() => {
    const formGroup = this.effectiveFormGroup();
    const field = this._field();
    if (!formGroup || !field) return null;
    return formGroup.get(field.id) as FormControl;
  });

  readonly isPartiallyAnonymized = computed<boolean>(() => {
    const entity = this.entity();
    const field = this._field();
    return !!(
      entity?.anonymized &&
      entity?.getSchema()?.get(field?.id)?.anonymize === "retain-anonymized"
    );
  });
}
