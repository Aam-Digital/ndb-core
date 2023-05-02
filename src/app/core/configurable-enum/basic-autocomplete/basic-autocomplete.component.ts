import {
  Component,
  ContentChild,
  ElementRef,
  Input,
  OnChanges,
  Optional,
  Self,
  TemplateRef,
  ViewChild,
} from "@angular/core";
import { AsyncPipe, NgForOf, NgIf, NgTemplateOutlet } from "@angular/common";
import { MatFormFieldControl } from "@angular/material/form-field";
import {
  FormControl,
  FormGroupDirective,
  NgControl,
  NgForm,
  ReactiveFormsModule,
} from "@angular/forms";
import { MatInput, MatInputModule } from "@angular/material/input";
import {
  MatAutocompleteModule,
  MatAutocompleteTrigger,
} from "@angular/material/autocomplete";
import { concat, of, skip } from "rxjs";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { distinctUntilChanged, filter, map, startWith } from "rxjs/operators";
import { ConfirmationDialogService } from "../../confirmation-dialog/confirmation-dialog.service";
import { ErrorStateMatcher } from "@angular/material/core";
import { CustomFormControlDirective } from "./custom-form-control.directive";
import { coerceBooleanProperty } from "@angular/cdk/coercion";

interface SelectableOption<O, V> {
  initial: O;
  asString: string;
  asValue: V;
  selected: boolean;
}

/** Custom `MatFormFieldControl` for telephone number input. */
@Component({
  selector: "app-basic-autocomplete",
  templateUrl: "basic-autocomplete.component.html",
  styleUrls: ["./basic-autocomplete.component.scss"],
  providers: [
    { provide: MatFormFieldControl, useExisting: BasicAutocompleteComponent },
  ],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatInputModule,
    MatAutocompleteModule,
    NgForOf,
    MatCheckboxModule,
    NgIf,
    AsyncPipe,
    NgTemplateOutlet,
  ],
})
export class BasicAutocompleteComponent<O, V = O>
  extends CustomFormControlDirective<V | V[]>
  implements OnChanges
{
  @ContentChild(TemplateRef) templateRef: TemplateRef<O>;
  // `_elementRef` is protected in `MapInput`
  @ViewChild(MatInput, { static: true }) inputElement: MatInput & {
    _elementRef: ElementRef<HTMLElement>;
  };
  @ViewChild(MatAutocompleteTrigger) autocomplete: MatAutocompleteTrigger;

  @Input() valueMapper = (option: O) => option as unknown as V;
  @Input() optionToString = (option) => option?.toString();
  @Input() createOption: (input: string) => O;
  @Input() multi?: boolean;

  autocompleteForm = new FormControl("");
  autocompleteSuggestedOptions = this.autocompleteForm.valueChanges.pipe(
    filter((val) => typeof val === "string"),
    distinctUntilChanged(),
    map((val) => this.updateAutocomplete(val)),
    startWith([] as SelectableOption<O, V>[])
  );
  showAddOption = false;

  get displayText() {
    if (this.multi) {
      return this._options
        .filter((o) => o.selected)
        .map((o) => o.asString)
        .join(", ");
    } else {
      return this.autocompleteForm.value;
    }
  }

  get disabled(): boolean {
    return this._disabled;
  }

  set disabled(value: boolean) {
    this._disabled = coerceBooleanProperty(value);
    this._disabled
      ? this.autocompleteForm.disable()
      : this.autocompleteForm.enable();
    this.stateChanges.next();
  }

  @Input() set options(options: O[]) {
    this._options = options.map((o) => this.toSelectableOption(o));
  }

  private _options: SelectableOption<O, V>[] = [];

  constructor(
    elementRef: ElementRef<HTMLElement>,
    private confirmation: ConfirmationDialogService,
    errorStateMatcher: ErrorStateMatcher,
    @Optional() @Self() ngControl: NgControl,
    @Optional() parentForm: NgForm,
    @Optional() parentFormGroup: FormGroupDirective
  ) {
    super(
      elementRef,
      errorStateMatcher,
      ngControl,
      parentForm,
      parentFormGroup
    );
  }

  ngOnChanges(changes: { [key in keyof this]?: any }) {
    if (changes.valueMapper) {
      this._options.forEach(
        (opt) => (opt.asValue = this.valueMapper(opt.initial))
      );
    }
    if (changes.optionToString) {
      this._options.forEach(
        (opt) => (opt.asString = this.optionToString(opt.initial))
      );
    }
    if (changes.value || changes.options) {
      this.setInitialInputValue();
    }
  }

  showAutocomplete() {
    this.autocompleteSuggestedOptions = concat(
      of(this._options),
      this.autocompleteSuggestedOptions.pipe(skip(1))
    );
  }

  private updateAutocomplete(inputText: string): SelectableOption<O, V>[] {
    let filteredOptions = this._options;
    if (inputText) {
      filteredOptions = this._options.filter((option) =>
        option.asString.toLowerCase().includes(inputText.toLowerCase())
      );
      this.showAddOption = !this._options.some(
        (o) => o.asString.toLowerCase() === inputText.toLowerCase()
      );
    }
    return filteredOptions;
  }

  private setInitialInputValue() {
    if (this.multi) {
      this._options.forEach(
        (o) => (o.selected = (this.value as V[])?.includes(o.asValue))
      );
      this.displaySelectedOptions();
    } else {
      const selected = this._options.find(
        ({ asValue }) => asValue === this.value
      );
      this.autocompleteForm.setValue(selected?.asString ?? "");
    }
  }

  private displaySelectedOptions() {
    this.autocompleteForm.setValue(
      this._options
        .filter((o) => o.selected)
        .map((o) => o.asString)
        .join(", ")
    );
  }

  select(selected: string | SelectableOption<O, V>) {
    if (typeof selected === "string") {
      this.createNewOption(selected);
      return;
    }

    if (selected) {
      this.selectOption(selected);
    } else {
      this.autocompleteForm.setValue("");
      this.value = undefined;
    }
    this.onChange(this.value);
  }

  async createNewOption(option: string) {
    const userConfirmed = await this.confirmation.getConfirmation(
      $localize`Create new option`,
      $localize`Do you want to create the new option "${option}"?`
    );
    if (userConfirmed) {
      const newOption = this.toSelectableOption(this.createOption(option));
      this._options.push(newOption);
      this.select(newOption);
    }
  }

  private selectOption(option: SelectableOption<O, V>) {
    if (this.multi) {
      option.selected = !option.selected;
      this.value = this._options
        .filter((o) => o.selected)
        .map((o) => o.asValue);
      // re-open autocomplete to select next option
      this.activateAutocompleteMode();
    } else {
      this.autocompleteForm.setValue(option.asString);
      this.value = option.asValue;
    }
  }

  private toSelectableOption(opt: O): SelectableOption<O, V> {
    return {
      initial: opt,
      asValue: this.valueMapper(opt),
      asString: this.optionToString(opt),
      selected: false,
    };
  }

  activateAutocompleteMode() {
    if (this.multi) {
      this.autocompleteForm.setValue("");
    } else {
      this.showAutocomplete();
    }
    setTimeout(() => this.inputElement.focus());
    this.focus();
  }

  onFocusOut(event: FocusEvent) {
    if (
      !this.elementRef.nativeElement.contains(event.relatedTarget as Element)
    ) {
      if (!this.multi) {
        this.checkForExactMatch();
      }
      this.blur();
    }
  }

  private checkForExactMatch() {
    const inputValue = this.autocompleteForm.value;
    const selectedOption = this._options.find(
      ({ asValue }) => asValue === this._value
    );
    if (selectedOption?.asString !== inputValue) {
      // try to select the option that matches the input string
      const matchingOption = this._options.find(
        ({ asString }) => asString.toLowerCase() === inputValue.toLowerCase()
      );
      this.select(matchingOption);
    }
  }

  onContainerClick(event: MouseEvent) {
    if (
      !this._disabled &&
      (event.target as Element).tagName.toLowerCase() != "input"
    ) {
      this.activateAutocompleteMode();
    }
  }

  writeValue(val: V[] | V) {
    super.writeValue(val);
    this.setInitialInputValue();
  }
}
