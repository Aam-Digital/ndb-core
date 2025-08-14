import {
  AbstractControl,
  ControlValueAccessor,
  FormGroupDirective,
  NgControl,
  NgForm,
  Validators,
} from "@angular/forms";
import { MatFormFieldControl } from "@angular/material/form-field";
import {
  Directive,
  DoCheck,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  inject,
} from "@angular/core";
import { Subject } from "rxjs";
import { coerceBooleanProperty } from "@angular/cdk/coercion";
import { ErrorStateMatcher } from "@angular/material/core";

/**
 * Extend this base class to implement custom input controls to be used as form fields.
 *
 * To use in mat-form-field, add a provider to your component:
 *   `providers: [{ provide: MatFormFieldControl, useExisting: MyCustomComponent }]`
 *
 * also refer to available public resources on Custom Form Controls:
 * - https://material.angular.io/guide/creating-a-custom-form-field-control
 * - https://www.youtube.com/watch?v=CD_t3m2WMM8
 */
@Directive()
export abstract class CustomFormControlDirective<T>
  implements ControlValueAccessor, MatFormFieldControl<T>, OnDestroy, DoCheck
{
  elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  errorStateMatcher = inject(ErrorStateMatcher);
  ngControl = inject(NgControl, { optional: true, self: true });
  parentForm = inject(NgForm, { optional: true });
  parentFormGroup = inject(FormGroupDirective, { optional: true });

  static nextId = 0;
  id = `custom-form-control-${CustomFormControlDirective.nextId++}`;
  // eslint-disable-next-line @angular-eslint/no-input-rename
  @Input("aria-describedby") userAriaDescribedBy: string;
  @Input() placeholder: string;

  @Input()
  get required() {
    return this._required;
  }

  set required(req: boolean) {
    this._required = coerceBooleanProperty(req);
    this.stateChanges.next();
  }

  private _required = false;

  stateChanges = new Subject<void>();
  focused = false;
  touched = false;
  errorState = false;
  controlType = "custom-control";
  onChange = (_: any) => {};
  onTouched = () => {};

  get empty() {
    return !this.value;
  }

  get shouldLabelFloat() {
    return this.focused || !this.empty;
  }

  @Input()
  get disabled(): boolean {
    return this._disabled;
  }

  set disabled(value: boolean) {
    this._disabled = coerceBooleanProperty(value);
    this.stateChanges.next();
  }

  _disabled = false;

  @Input() get value(): T {
    return this._value;
  }

  set value(value: T) {
    if (
      value === this._value ||
      JSON.stringify(value) === JSON.stringify(this._value)
    )
      return;

    this._value = value;
    this.onChange(value);
    this.valueChange.emit(value);
    this.stateChanges.next();
  }

  _value: T;

  @Output() valueChange = new EventEmitter<T>();

  constructor() {
    if (this.ngControl != null) {
      this.ngControl.valueAccessor = this;
    }

    this.elementRef.nativeElement.addEventListener("focusin", () =>
      this.focus(),
    );
    this.elementRef.nativeElement.addEventListener("focusout", () =>
      this.blur(),
    );
  }

  ngOnDestroy() {
    this.stateChanges.complete();
  }

  focus() {
    this.focused = true;
    this.stateChanges.next();
  }

  blur() {
    this.touched = true;
    this.focused = false;
    this.onTouched();
    this.stateChanges.next();
  }

  setDescribedByIds(ids: string[]) {
    this.elementRef.nativeElement.setAttribute(
      "aria-describedby",
      ids.join(" "),
    );
  }

  onContainerClick(event: MouseEvent) {}

  /** @deprecated the this.value setter seems to already do the same? */
  writeValue(val: T): void {
    this.value = val;
    this.valueChange.emit(val);
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

  ngDoCheck() {
    const control = this.ngControl
      ? (this.ngControl.control as AbstractControl)
      : null;

    this.checkUpdateErrorState(control);
    this.checkUpdateRequired(control);
  }

  /**
   * Updates the error state based on the form control
   * Taken from {@link https://github.com/angular/components/blob/a1d5614f18066c0c2dc2580c7b5099e8f68a8e74/src/material/core/common-behaviors/error-state.ts#L59}
   */
  private checkUpdateErrorState(control: AbstractControl | null) {
    const oldState = this.errorState;
    const parent = this.parentFormGroup || this.parentForm;
    const newState = this.errorStateMatcher.isErrorState(control, parent);

    if (newState !== oldState) {
      this.errorState = newState;
      this.stateChanges.next();
    }
  }

  private checkUpdateRequired(control: AbstractControl | null) {
    if (!control) {
      return;
    }

    if (
      this.required !==
      coerceBooleanProperty(control.hasValidator(Validators.required))
    ) {
      this.required = control.hasValidator(Validators.required);
    }
  }
}
