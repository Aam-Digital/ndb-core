import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  Input,
  LOCALE_ID,
  OnInit,
  Signal,
  signal,
  WritableSignal,
} from "@angular/core";
import { DatePipe } from "@angular/common";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldControl } from "@angular/material/form-field";
import { FormFieldConfig } from "../../../common-components/entity-form/FormConfig";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";
import { EditComponent } from "../../../entity/entity-field-edit/dynamic-edit/edit-component.interface";
import { CustomFormControlDirective } from "../../../common-components/basic-autocomplete/custom-form-control.directive";
import { BasicAutocompleteComponent } from "../../../common-components/basic-autocomplete/basic-autocomplete.component";

/**
 * Edit component for date format configuration.
 * Provides predefined format options and allows custom format strings.
 */
@DynamicComponent("EditDateFormat")
@Component({
  selector: "app-edit-date-format",
  templateUrl: "./edit-date-format.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BasicAutocompleteComponent, ReactiveFormsModule],
  providers: [
    { provide: MatFormFieldControl, useExisting: EditDateFormatComponent },
  ],
})
export class EditDateFormatComponent
  extends CustomFormControlDirective<string>
  implements EditComponent, OnInit
{
  @Input() formFieldConfig?: FormFieldConfig;

  private readonly datePipe = new DatePipe(inject(LOCALE_ID));
  // Fixed reference date to illustrate each format: January 22, 2026
  private readonly exampleDate = new Date(2026, 0, 22);

  readonly predefinedFormats: string[] = [
    "dd.MM.yyyy",
    "MM/dd/yyyy",
    "yyyy-MM-dd",
    "dd/MM/yyyy",
    "MMM d, yyyy",
  ];

  formatOptionToString = (format: string): string => {
    try {
      const example = this.datePipe.transform(this.exampleDate, format) ?? "";
      // Angular DatePipe interprets unknown characters as tokens and never throws,
      // so we verify the output actually contains the example year as a sanity check.
      const exampleYear = this.datePipe.transform(this.exampleDate, "y");
      return example?.includes(exampleYear)
        ? `${format}  (${example})`
        : format;
    } catch {
      return format;
    }
  };

  get formControl(): FormControl<string> {
    return this.ngControl.control as FormControl<string>;
  }

  private readonly currentValue: WritableSignal<string | null | undefined> =
    signal(undefined);

  ngOnInit() {
    this.currentValue.set(this.formControl.value);
    this.formControl.valueChanges.subscribe((value) => {
      this.currentValue.set(value);
    });
  }

  /**
   * Get all format options including any custom format currently set
   */
  formatOptions: Signal<string[]> = computed(() => {
    const value = this.currentValue();
    if (value && !this.predefinedFormats.includes(value)) {
      return [...this.predefinedFormats, value];
    }
    return this.predefinedFormats;
  });

  createCustomFormat = async (input: string) => input.trim();
}
