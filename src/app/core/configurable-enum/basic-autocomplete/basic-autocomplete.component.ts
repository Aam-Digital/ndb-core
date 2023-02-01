import {
  Component,
  ContentChild,
  ElementRef,
  HostBinding,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  Optional,
  Self,
  SimpleChanges,
  TemplateRef,
  ViewChild,
} from "@angular/core";
import { AsyncPipe, NgForOf, NgIf, NgTemplateOutlet } from "@angular/common";
import {
  MAT_FORM_FIELD,
  MatFormField,
  MatFormFieldControl,
} from "@angular/material/form-field";
import {
  ControlValueAccessor,
  FormControl,
  NgControl,
  ReactiveFormsModule,
} from "@angular/forms";
import { MatInputModule } from "@angular/material/input";
import {
  MatAutocompleteModule,
  MatAutocompleteTrigger,
} from "@angular/material/autocomplete";
import { BehaviorSubject, Subject, Subscription } from "rxjs";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { filter } from "rxjs/operators";
import { ConfirmationDialogService } from "../../confirmation-dialog/confirmation-dialog.service";
import { BooleanInput, coerceBooleanProperty } from "@angular/cdk/coercion";

export interface SelectableOption<O, V> {
  initial: O;
  asString: string;
  asValue: V;
  selected: boolean;
}

/** Custom `MatFormFieldControl` for telephone number input. */
@Component({
  selector: "app-basic-autocomplete",
  templateUrl: "basic-autocomplete.component.html",
  styleUrls: ["basic-autocomplete.component.scss"],
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
export class BasicAutocompleteComponent<O, V>
  implements
    ControlValueAccessor,
    MatFormFieldControl<V | V[]>,
    OnDestroy,
    OnChanges
{
  static nextId = 0;
  @HostBinding()
  id = `basic-autocomplete-${BasicAutocompleteComponent.nextId++}`;
  // eslint-disable-next-line @angular-eslint/no-input-rename
  @Input("aria-describedby") userAriaDescribedBy: string;
  @ContentChild(TemplateRef) templateRef: TemplateRef<O>;
  @ViewChild("inputElement") inputElement: ElementRef<HTMLInputElement>;
  @ViewChild(MatAutocompleteTrigger) autocomplete: MatAutocompleteTrigger;

  stateChanges = new Subject<void>();
  focused = false;
  touched = false;
  controlType = "basic-autocomplete";
  autocompleteForm = new FormControl("");
  autocompleteSuggestedOptions = new BehaviorSubject<SelectableOption<O, V>[]>(
    []
  );
  closeSubscription: Subscription;
  showAddOption = false;
  addOptionTimeout: any;
  onChange = (_: any) => {};
  onTouched = () => {};

  get empty() {
    return !this.value;
  }

  get shouldLabelFloat() {
    return this.focused || !this.empty;
  }

  @Input()
  get placeholder(): string {
    return this._placeholder;
  }

  set placeholder(value: string) {
    this._placeholder = value;
    this.stateChanges.next();
  }

  private _placeholder: string;

  @Input()
  get required(): boolean {
    return this._required;
  }

  set required(value: BooleanInput) {
    this._required = coerceBooleanProperty(value);
    this.stateChanges.next();
  }

  private _required = false;

  @Input()
  get disabled(): boolean {
    return this._disabled;
  }

  set disabled(value: BooleanInput) {
    this._disabled = coerceBooleanProperty(value);
    if (this._disabled) {
      this.autocompleteForm.disable();
    } else {
      this.autocompleteForm.enable();
    }
    this.stateChanges.next();
  }

  private _disabled = false;

  @Input() get value(): V | V[] {
    return this._value;
  }

  set value(value: V | V[]) {
    this._value = value;
    this.stateChanges.next();
  }

  private _value: V | V[];

  get errorState(): boolean {
    return false;
  }

  @Input() set options(options: O[]) {
    this._options = options.map((o) => this.toSelectableOption(o));
  }

  _options: SelectableOption<O, V>[] = [];

  @Input() set valueMapper(value: (option: O) => V) {
    this._valueMapper = value;
    this._options.forEach((opt) => (opt.asValue = value(opt.initial)));
  }

  private _valueMapper = (option: O) => option as unknown as V;

  @Input() set optionToString(value: (option: O) => string) {
    this._optionToString = value;
    this._options.forEach((opt) => (opt.asString = value(opt.initial)));
  }

  private _optionToString = (option) => option?.toString();

  @Input() createOption: (input: string) => O;

  @Input() multi?: boolean;

  constructor(
    private elementRef: ElementRef<HTMLElement>,
    private confirmation: ConfirmationDialogService,
    @Optional() @Inject(MAT_FORM_FIELD) public _formField: MatFormField,
    @Optional() @Self() public ngControl: NgControl
  ) {
    if (this.ngControl != null) {
      this.ngControl.valueAccessor = this;
    }
    this.autocompleteForm.valueChanges
      .pipe(filter((val) => typeof val === "string"))
      .subscribe((val) => this.updateAutocomplete(val));
  }

  ngOnDestroy() {
    this.stateChanges.complete();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.value || changes.options) {
      if (this.multi) {
        this._options
          .filter(({ asValue }) => (this.value as V[])?.includes(asValue))
          .forEach((o) => (o.selected = true));
      }
      this.setInputValue();
    }
  }

  showAutocomplete(inputText?: string) {
    this.updateAutocomplete(inputText);
    this.inputElement?.nativeElement.focus();
  }

  private updateAutocomplete(inputText: string) {
    let filteredEntities = this._options;
    this.showAddOption = false;
    clearTimeout(this.addOptionTimeout);
    if (inputText) {
      filteredEntities = this._options.filter((option) =>
        option.asString.toLowerCase().includes(inputText.toLowerCase())
      );
      const exists = this._options.find(
        (o) => o.asString.toLowerCase() === inputText.toLowerCase()
      );
      if (!exists) {
        this.addOptionTimeout = setTimeout(
          () => (this.showAddOption = true),
          1000
        );
      }
    }
    this.autocompleteSuggestedOptions.next(filteredEntities);
  }

  private setInputValue() {
    if (this.multi) {
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
      `Do you want to create the new option ${option}`
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
      asValue: this._valueMapper(opt),
      asString: this._optionToString(opt),
      selected: false,
    };
  }

  onFocusIn() {
    if (!this.focused) {
      this.closeSubscription?.unsubscribe();
      if (this.multi) {
        this.autocompleteForm.setValue("");
      }
      this.focused = true;
      this.stateChanges.next();
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
        this.closeSubscription = this.autocomplete.panelClosingActions
          .pipe(filter((res) => res === null))
          .subscribe(() => this.notifyFocusOut());
      }
    }
  }

  private notifyFocusOut() {
    if (this.multi) {
      this.displaySelectedOptions();
    }
    this.touched = true;
    this.focused = false;
    this.onTouched();
    this.stateChanges.next();
  }

  setDescribedByIds(ids: string[]) {
    const controlElement = this.elementRef.nativeElement.querySelector(
      ".autocomplete-input"
    )!;
    controlElement.setAttribute("aria-describedby", ids.join(" "));
  }

  onContainerClick(event: MouseEvent) {
    if ((event.target as Element).tagName.toLowerCase() != "input") {
      this.elementRef.nativeElement.focus();
    }
  }

  writeValue(val: V | V[]): void {
    this.value = val;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
