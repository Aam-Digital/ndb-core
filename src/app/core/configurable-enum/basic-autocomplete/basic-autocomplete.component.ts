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
  MatAutocomplete,
  MatAutocompleteModule,
} from "@angular/material/autocomplete";
import { BehaviorSubject, Subject } from "rxjs";
import { UntilDestroy } from "@ngneat/until-destroy";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { filter } from "rxjs/operators";
import { ConfirmationDialogService } from "../../confirmation-dialog/confirmation-dialog.service";
import { coerceBooleanProperty } from "@angular/cdk/coercion";

interface SelectableOption<O, V> {
  initial: O;
  asString: string;
  asValue: V;
  selected: boolean;
}

@UntilDestroy()
@Component({
  selector: "app-basic-autocomplete",
  templateUrl: "./basic-autocomplete.component.html",
  styleUrls: ["./basic-autocomplete.component.scss"],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatInputModule,
    MatAutocompleteModule,
    AsyncPipe,
    NgForOf,
    MatCheckboxModule,
    NgIf,
    NgTemplateOutlet,
  ],
  providers: [
    { provide: MatFormFieldControl, useExisting: BasicAutocompleteComponent },
  ],
  //changeDetection: ChangeDetectionStrategy.OnPush
})
export class BasicAutocompleteComponent<O, V>
  implements
    MatFormFieldControl<V | V[]>,
    OnDestroy,
    OnChanges,
    ControlValueAccessor
{
  stateChanges = new Subject<void>();

  onChange = (_: any) => {};
  onTouched = () => {};

  @Input() get value(): V | V[] {
    return this.selected;
  }

  set value(value: V | V[]) {
    this.selected = value;
    this.setInputValue();
    this.stateChanges.next();
  }

  selected: V | V[];

  static nextId = 0;
  @HostBinding()
  id = `basic-autocomplete-${BasicAutocompleteComponent.nextId++}`;

  @Input() placeholder: string;

  @ViewChild("inputElement") inputElement: ElementRef<HTMLInputElement>;
  @ViewChild(MatAutocomplete) autocomplete: MatAutocomplete;
  focused = false;
  touched = false;

  onFocusIn() {
    if (!this.focused) {
      this.focused = true;
      this.stateChanges.next();
    }
  }

  onFocusOut(event: FocusEvent) {
    if (
      !this.autocomplete.isOpen &&
      !this._elementRef.nativeElement.contains(event.relatedTarget as Element)
    ) {
      this.touched = true;
      this.focused = false;
      this.resetIfInvalidOption(this.inputElement.nativeElement.value);
      this.stateChanges.next();
    }
  }

  get empty() {
    return !this.value;
  }

  @HostBinding("class.floating")
  get shouldLabelFloat() {
    return this.focused || !this.empty;
  }

  @Input()
  get required() {
    return this._required;
  }

  set required(req) {
    this._required = coerceBooleanProperty(req);
    this.stateChanges.next();
  }

  private _required = false;

  @Input()
  get disabled(): boolean {
    return this._disabled;
  }

  set disabled(value: boolean) {
    this._disabled = coerceBooleanProperty(value);
    this.stateChanges.next();
  }

  private _disabled = false;

  errorState = false;

  controlType = "basic-autocomplete";

  // eslint-disable-next-line @angular-eslint/no-input-rename
  @Input("aria-describedby") userAriaDescribedBy: string;

  @Input() set options(options: O[]) {
    this._options = options.map((o) => this.toSelectableOption(o));
  }

  _options: SelectableOption<O, V>[] = [];

  @Input() multi?: boolean;

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

  @ContentChild(TemplateRef) templateRef: TemplateRef<O>;

  autocompleteForm = new FormControl("");
  autocompleteSuggestedOptions = new BehaviorSubject<SelectableOption<O, V>[]>(
    []
  );
  showAddOption = false;
  addOptionTimeout: any;

  constructor(
    private confirmation: ConfirmationDialogService,
    private _elementRef: ElementRef<HTMLElement>,
    @Optional() @Inject(MAT_FORM_FIELD) public _formField: MatFormField,
    @Optional() @Self() public ngControl: NgControl
  ) {
    // Replace the provider from above with this.
    if (this.ngControl != null) {
      // Setting the value accessor directly (instead of using
      // the providers) to avoid running into a circular import.
      this.ngControl.valueAccessor = this;
    }
    this.autocompleteForm.valueChanges
      .pipe(filter((val) => typeof val === "string"))
      .subscribe((val) => this.updateAutocomplete(val?.split(", ").pop()));
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

  private setInputValue() {
    if (this.multi) {
      this.autocompleteForm.setValue(
        this._options
          .filter((o) => o.selected)
          .map((o) => o.asString)
          .join(", ")
      );
    } else {
      const selected = this._options.find(
        ({ asValue }) => asValue === this.value
      );
      this.autocompleteForm.setValue(selected?.asString ?? "");
    }
  }

  showAutocomplete(inputText?: string) {
    this.updateAutocomplete(inputText);
    this.inputElement?.nativeElement.focus();
  }

  updateAutocomplete(inputText: string) {
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
    } else {
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

  resetIfInvalidOption(input: string) {
    // waiting for other tasks to finish and then reset input if nothing was selected
    setTimeout(() => {
      const activeOption = this._optionToString(this.value);
      if (input !== activeOption) {
        this.autocompleteForm.setValue(activeOption);
      }
    });
  }

  setDescribedByIds(ids: string[]) {
    const controlElement = this._elementRef.nativeElement.querySelector(
      ".autocomplete-input"
    )!;
    controlElement.setAttribute("aria-describedby", ids.join(" "));
  }

  onContainerClick(event: MouseEvent) {
    if ((event.target as Element).tagName.toLowerCase() != "input") {
      this._elementRef.nativeElement.focus();
    }
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

  writeValue(obj: V | V[]): void {
    this.value = obj;
  }
}
