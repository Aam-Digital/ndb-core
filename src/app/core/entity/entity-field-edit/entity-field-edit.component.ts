import { EntityForm } from "#src/app/core/common-components/entity-form/entity-form";
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  inject,
  Injector,
  input,
} from "@angular/core";
import { toObservable } from "@angular/core/rxjs-interop";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { map, Observable, of, startWith, switchMap } from "rxjs";
import {
  createCurrentRecordState,
  CurrentRecordContext,
} from "#src/app/core/common-components/entity-form/current-record-state";
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
  providers: [
    {
      provide: CurrentRecordContext,
      useExisting: forwardRef(() => EntityFieldEditComponent),
    },
  ],
})
export class EntityFieldEditComponent<
  T extends Entity = Entity,
> implements CurrentRecordContext {
  private entityFormService = inject(EntityFormService);
  private entitySchemaService = inject(EntitySchemaService);
  private readonly injector = inject(Injector);

  /** field id or full config */
  field = input<ColumnConfig>();

  entity = input<T>();
  form = input<EntityForm<T>>();

  /** Whether to display the field in a limited space, hiding details like the help description button. */
  compactMode = input<boolean>();

  /** Whether to display the field label or not. */
  hideLabel = input<boolean>();

  /** Whether to hide the inherit value button for inherited-field default values. */
  hideInheritButton = input<boolean>(false);

  /**
   * Whether the field edits a value for several records at once (e.g. bulk edit),
   * so that there is no single "current record" other fields could be compared with.
   */
  forMultipleRecords = input(false, { transform: booleanAttribute });

  /**
   * The record with the current, possibly unsaved values of its form,
   * for fields that depend on other fields of the record.
   * Only computed while subscribed, so fields that don't need it don't cost anything.
   */
  currentRecordState(): Observable<T | undefined> {
    return toObservable(
      computed(() => ({
        entity: this.entity(),
        form: this.form(),
        forMultipleRecords: this.forMultipleRecords(),
      })),
      { injector: this.injector },
    ).pipe(
      switchMap(({ entity, form, forMultipleRecords }) => {
        if (!entity || forMultipleRecords) {
          return of(undefined);
        }
        if (!form) {
          return of(entity);
        }
        return form.formGroup.valueChanges.pipe(
          startWith(null),
          map(() => createCurrentRecordState(entity, form.formGroup)),
        );
      }),
    );
  }

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

  readonly formControl = computed<FormControl | null>(() => {
    const form = this.form();
    const field = this._field();
    if (!form || !field) return null;
    return form.formGroup.get(field.id) as FormControl;
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
