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
 * Form field to edit the condition that a record has to match to offer an external link.
 *
 * The fields offered in the condition are those of the record type selected in the same form.
 */
@DynamicComponent("EditExternalLinkCondition")
@Component({
  selector: "app-edit-external-link-condition",
  imports: [AdminDisplayConditionButtonComponent],
  template: `
    <div class="flex-row align-center gap-regular">
      <span class="flex-grow">{{ summary() }}</span>
      <app-admin-display-condition-button
        target="field"
        [showLabel]="true"
        [disabled]="!enabled() || !recordTypeConstructor()"
        [entityType]="recordTypeConstructor()"
        [condition]="hasCondition() ? valueSignal() : undefined"
        createLabel="Add Condition"
        i18n-createLabel
        editLabel="Edit Condition"
        i18n-editLabel
        tooltip="Show the link only for records matching a condition."
        i18n-tooltip
        explanation="This link is shown only for records matching..."
        i18n-explanation
        (conditionChange)="setCondition($event)"
      ></app-admin-display-condition-button>
    </div>
  `,
  providers: [
    {
      provide: MatFormFieldControl,
      useExisting: EditExternalLinkConditionComponent,
    },
  ],
})
export class EditExternalLinkConditionComponent
  extends CustomFormControlDirective<DataFilter<Entity> | undefined>
  implements EditComponent, OnInit
{
  private readonly entities = inject(EntityRegistry);
  private readonly destroyRef = inject(DestroyRef);

  /** the record type as currently selected in the same form, which may not be saved yet */
  private readonly recordType = signal<string | undefined>(undefined);

  protected readonly recordTypeConstructor = computed(() => {
    const type = this.recordType();
    return type && this.entities.has(type)
      ? this.entities.get(type)
      : undefined;
  });

  formFieldConfig = input<FormFieldConfig>();
  entity = input<Entity>();

  protected readonly hasCondition = computed(
    () => Object.keys(this.valueSignal() ?? {}).length > 0,
  );

  protected readonly summary = computed(() =>
    this.hasCondition()
      ? $localize`Shown only for records matching a condition on: ${this.conditionFieldLabels().join(", ")}:fields:`
      : $localize`Shown for all records of the type.`,
  );

  /** labels of the fields the condition refers to, also inside `$and` / `$or` / `$nor` */
  private readonly conditionFieldLabels = computed(() => {
    const schema = this.recordTypeConstructor()?.schema;
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
    const recordTypeControl = this.formControl?.parent?.get("entity");
    if (!recordTypeControl) return;

    this.recordType.set(recordTypeControl.value);
    recordTypeControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((recordType: string | undefined) => {
        // a condition refers to fields of the previous record type
        if (recordType !== this.recordType() && this.hasCondition()) {
          this.setCondition(null);
        }
        this.recordType.set(recordType);
      });
  }

  /** @param condition the new condition, `null` if it was removed */
  protected setCondition(condition: DataFilter<Entity> | null) {
    this.formControl.setValue(condition ?? undefined);
    this.formControl.markAsDirty();
  }
}
