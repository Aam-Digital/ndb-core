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
  HostBinding,
  Input,
  OnDestroy,
} from "@angular/core";
import { Subject } from "rxjs";
import { coerceBooleanProperty } from "@angular/cdk/coercion";
import { ErrorStateMatcher } from "@angular/material/core";

@Directive()
export abstract class CustomFormControlDirective<T>
  implements ControlValueAccessor, MatFormFieldControl<T>, OnDestroy, DoCheck
{
  static nextId = 0;
  @HostBinding()
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

  abstract inputElement: { _elementRef: ElementRef<HTMLElement> };
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
    this._value = value;
    this.stateChanges.next();
  }

  _value: T;

  constructor(
    public elementRef: ElementRef<HTMLElement>,
    public errorStateMatcher: ErrorStateMatcher,
    public ngControl: NgControl,
    public parentForm: NgForm,
    public parentFormGroup: FormGroupDirective,
  ) {
    if (this.ngControl != null) {
      this.ngControl.valueAccessor = this;
    }
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
    this.inputElement._elementRef.nativeElement.setAttribute(
      "aria-describedby",
      ids.join(" "),
    );
  }

  abstract onContainerClick(event: MouseEvent);

  writeValue(val: T): void {
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

  /**
   * Updates the error state based on the form control
   * Taken from {@link https://github.com/angular/components/blob/a1d5614f18066c0c2dc2580c7b5099e8f68a8e74/src/material/core/common-behaviors/error-state.ts#L59}
   */
  ngDoCheck() {
    const oldState = this.errorState;
    const parent = this.parentFormGroup || this.parentForm;
    const control = this.ngControl
      ? (this.ngControl.control as AbstractControl)
      : null;
    const newState = this.errorStateMatcher.isErrorState(control, parent);

    if (newState !== oldState) {
      this.errorState = newState;
      this.stateChanges.next();
    }

    if (control.hasValidator(Validators.required)) {
      this.required = true;
      this.stateChanges.next();
    } else if (this.required) {
      this.required = false;
      this.stateChanges.next();
    }
  }
}
