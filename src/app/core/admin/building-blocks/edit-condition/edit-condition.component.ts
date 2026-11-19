import {
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  OnInit,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MatFormFieldControl } from "@angular/material/form-field";
import { AdminDisplayConditionButtonComponent } from "#src/app/core/admin/building-blocks/admin-display-condition-button/admin-display-condition-button.component";
import { CustomFormControlDirective } from "#src/app/core/common-components/basic-autocomplete/custom-form-control.directive";
import { FormFieldConfig } from "#src/app/core/common-components/entity-form/FormConfig";
import { DynamicComponent } from "#src/app/core/config/dynamic-components/dynamic-component.decorator";
import { EntityRegistry } from "#src/app/core/entity/database-entity.decorator";
import { EditComponent } from "#src/app/core/entity/entity-field-edit/dynamic-edit/edit-component.interface";
import { Entity } from "#src/app/core/entity/model/entity";
import { DataFilter } from "#src/app/core/filter/filters/filters";

/**
 * The `additional` config of a field using the `EditCondition` edit component.
 */
export interface EditConditionConfig {
  /**
   * ID of the field in the same form that holds the entity type whose fields the condition refers to.
   * Changing that field clears the condition.
   */
  entityTypeField: string;

  /**
   * (Optional) Explanation at the top of the condition editor, e.g. "This link is shown only for records matching...".
   */
  explanation?: string;
}

/**
 * Form field to edit a condition (`DataFilter`) on records of the entity type selected in another field of the same form,
 * e.g. for a config entity that applies only to some records of its type.
 *
 * Use the `description` of the field to explain in the form what the condition does.
 *
 * E.g.
 * ```json
 * {
 *   "id": "condition",
 *   "editComponent": "EditCondition",
 *   "additional": { "entityTypeField": "entity" }
 * }
 * ```
 */
@DynamicComponent("EditCondition")
@Component({
  selector: "app-edit-condition",
  imports: [AdminDisplayConditionButtonComponent],
  template: `
    <div class="flex-row align-center gap-regular">
      <span class="flex-grow">{{ summary() }}</span>
      <app-admin-display-condition-button
        target="field"
        [showLabel]="true"
        [disabled]="!enabled() || !entityType()"
        [entityType]="entityType()"
        [condition]="hasCondition() ? valueSignal() : undefined"
        createLabel="Add Condition"
        i18n-createLabel
        editLabel="Edit Condition"
        i18n-editLabel
        tooltip="Apply only to records matching a condition."
        i18n-tooltip
        [explanation]="explanation()"
        (conditionChange)="setCondition($event)"
      ></app-admin-display-condition-button>
    </div>
  `,
  providers: [
    { provide: MatFormFieldControl, useExisting: EditConditionComponent },
  ],
})
export class EditConditionComponent
  extends CustomFormControlDirective<DataFilter<Entity> | undefined>
  implements EditComponent, OnInit
{
  private readonly entities = inject(EntityRegistry);
  private readonly destroyRef = inject(DestroyRef);

  formFieldConfig = input<FormFieldConfig>();
  entity = input<Entity>();

  private readonly config = computed(
    () => this.formFieldConfig()?.additional as EditConditionConfig | undefined,
  );

  protected readonly explanation = computed(
    () =>
      this.config()?.explanation ??
      $localize`This applies only to records matching...`,
  );

  /** the entity type as currently selected in the same form, which may not be saved yet */
  private readonly entityTypeId = signal<string | undefined>(undefined);

  protected readonly entityType = computed(() => {
    const type = this.entityTypeId();
    return type && this.entities.has(type)
      ? this.entities.get(type)
      : undefined;
  });

  protected readonly hasCondition = computed(
    () => Object.keys(this.valueSignal() ?? {}).length > 0,
  );

  protected readonly summary = computed(() =>
    this.hasCondition()
      ? $localize`Only records matching a condition on: ${this.conditionFieldLabels().join(", ")}:fields:`
      : $localize`All records of the type.`,
  );

  /** labels of the fields the condition refers to, also inside `$and` / `$or` / `$nor` */
  private readonly conditionFieldLabels = computed(() => {
    const schema = this.entityType()?.schema;
    const keys = new Set<string>();
    const collect = (condition: unknown) => {
      for (const [key, value] of Object.entries(condition ?? {})) {
        if (key.startsWith("$")) {
          (Array.isArray(value) ? value : [value]).forEach(collect);
        } else {
          keys.add(key);
        }
      }
    };
    collect(this.valueSignal());
    return [...keys].map((key) => schema?.get(key)?.label ?? key);
  });

  ngOnInit() {
    const entityTypeField = this.config()?.entityTypeField;
    const entityTypeControl = entityTypeField
      ? this.formControl?.parent?.get(entityTypeField)
      : undefined;
    if (!entityTypeControl) return;

    this.entityTypeId.set(entityTypeControl.value);
    entityTypeControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((entityType: string | undefined) => {
        // a condition refers to fields of the previous entity type
        if (entityType !== this.entityTypeId() && this.hasCondition()) {
          this.setCondition(null);
        }
        this.entityTypeId.set(entityType);
      });
  }

  /** @param condition the new condition, `null` if it was removed */
  protected setCondition(condition: DataFilter<Entity> | null) {
    this.formControl.setValue(condition ?? undefined);
    this.formControl.markAsDirty();
  }
}
