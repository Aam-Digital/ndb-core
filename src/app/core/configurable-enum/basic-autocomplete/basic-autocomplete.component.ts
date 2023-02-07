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
import { MatInputModule } from "@angular/material/input";
import {
  MatAutocompleteModule,
  MatAutocompleteTrigger,
} from "@angular/material/autocomplete";
import { concat, of, skip } from "rxjs";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { filter, map, startWith } from "rxjs/operators";
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
  @ViewChild("inputElement") inputElement: ElementRef<HTMLInputElement>;
  @ViewChild(MatAutocompleteTrigger) autocomplete: MatAutocompleteTrigger;

  @Input() valueMapper = (option: O) => option as unknown as V;
  @Input() optionToString = (option) => option?.toString();
  @Input() createOption: (input: string) => O;
  @Input() multi?: boolean;

  autocompleteForm = new FormControl("");
  autocompleteSuggestedOptions = this.autocompleteForm.valueChanges.pipe(
    filter((val) => typeof val === "string"),
    map((val) => this.updateAutocomplete(val)),
    startWith([])
  );
  showAddOption = false;
  private addOptionTimeout: any;
  private delayedBlur: any;

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
    this.showAddOption = false;
    clearTimeout(this.addOptionTimeout);
    if (inputText) {
      filteredOptions = this._options.filter((option) =>
        option.asString.toLowerCase().includes(inputText.toLowerCase())
      );
      const exists = this._options.find(
        (o) => o.asString.toLowerCase() === inputText.toLowerCase()
      );
      if (!exists) {
        // show 'add option' after short timeout if user doesn't enter anything
        this.addOptionTimeout = setTimeout(
          () => (this.showAddOption = true),
          1000
        );
      }
    }
    return filteredOptions;
  }

  private setInitialInputValue() {
    if (this.multi) {
      this._options
        .filter(({ asValue }) => (this.value as V[])?.includes(asValue))
        .forEach((o) => (o.selected = true));
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
      `Do you want to create the new option "${option}"?`
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
      this.autocompleteForm.setValue("");
      setTimeout(() => this.autocomplete.openPanel(), 100);
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

  onFocusIn() {
    clearTimeout(this.delayedBlur);
    if (!this.focused) {
      if (this.multi) {
        this.autocompleteForm.setValue("");
      }
      this.focus();
    }
  }

  onFocusOut(event: FocusEvent) {
    if (
      !this.elementRef.nativeElement.contains(event.relatedTarget as Element)
    ) {
      if (!this.autocomplete.panelOpen) {
        this.notifyFocusOut();
      } else {
        // trigger focus out once panel is closed
        this.delayedBlur = setTimeout(() => this.notifyFocusOut(), 100);
      }
    }
  }

  private notifyFocusOut() {
    if (this.multi) {
      this.displaySelectedOptions();
    } else {
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
    this.blur();
  }

  onContainerClick(event: MouseEvent) {
    if ((event.target as Element).tagName.toLowerCase() != "input") {
      this.inputElement.nativeElement.focus();
    }
  }
}
