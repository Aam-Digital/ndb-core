import { Component, computed, input, OnInit, signal } from "@angular/core";
import { MatCheckbox } from "@angular/material/checkbox";
import { MatTooltip } from "@angular/material/tooltip";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { CustomFormControlDirective } from "../../../../common-components/basic-autocomplete/custom-form-control.directive";
import { MatFormFieldControl } from "@angular/material/form-field";
import { EntityConstructor } from "../../../../entity/model/entity";
import { FormControl, ReactiveFormsModule } from "@angular/forms";

/**
 * Admin UI component for configuring whether an entity field is searchable.
 * Extends CustomFormControlDirective to integrate with Angular forms.
 */
@Component({
  selector: "app-admin-searchable-checkbox",
  imports: [MatCheckbox, MatTooltip, FaIconComponent, ReactiveFormsModule],
  templateUrl: "./admin-searchable-checkbox.component.html",
  styleUrl: "./admin-searchable-checkbox.component.scss",
  providers: [
    {
      provide: MatFormFieldControl,
      useExisting: AdminSearchableCheckboxComponent,
    },
  ],
})
export class AdminSearchableCheckboxComponent
  extends CustomFormControlDirective<boolean>
  implements OnInit
{
  entityType = input.required<EntityConstructor>();
  fieldId = input.required<string>();
  dataType = input.required<string>();

  searchableControl: FormControl<boolean>;
  private readonly isChecked = signal(false);

  private readonly searchableDataTypes = new Set([
    "string",
    "long-text",
    "email",
    "url",
    "number",
  ]);

  readonly isSearchableDataType = computed(() =>
    this.searchableDataTypes.has(this.dataType()),
  );

  readonly isImplicitlySearchable = computed(() => {
    const fieldId = this.fieldId();
    const toStringAttributes = this.entityType()?.toStringAttributes ?? [];
    return !!fieldId && toStringAttributes.includes(fieldId);
  });

  readonly showImplicitSearchableNote = computed(
    () => this.isImplicitlySearchable() && !this.isChecked(),
  );

  ngOnInit() {
    this.searchableControl = new FormControl(this.value ?? false);
    this.isChecked.set(this.value ?? false);

    this.searchableControl.valueChanges.subscribe((value) => {
      this.isChecked.set(!!value);
      if (this.value !== value) {
        this.value = value;
      }
    });

    this.applySearchableAvailability();
  }

  override writeValue(value: boolean, shouldEmit = false): void {
    const prevValue = this._value;
    super.writeValue(value, shouldEmit);
    this.isChecked.set(!!value);
    if (this.searchableControl && prevValue !== value) {
      this.searchableControl.setValue(value ?? false, { emitEvent: false });
      this.applySearchableAvailability();
    }
  }

  private applySearchableAvailability() {
    if (!this.searchableControl) {
      return;
    }

    if (!this.isSearchableDataType()) {
      this.searchableControl.setValue(false);
      this.searchableControl.disable({ emitEvent: false });
      return;
    }

    if (this.searchableControl.disabled) {
      this.searchableControl.enable({ emitEvent: false });
    }
  }
}
