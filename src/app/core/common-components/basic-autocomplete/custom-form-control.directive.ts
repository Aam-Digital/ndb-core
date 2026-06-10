import { coerceBooleanProperty } from "@angular/cdk/coercion";
import {
  DestroyRef,
  Directive,
  DoCheck,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  Signal,
  computed,
  inject,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  AbstractControl,
  ControlValueAccessor,
  FormControl,
  FormGroupDirective,
  NgControl,
  NgForm,
  Validators,
} from "@angular/forms";
import { ErrorStateMatcher } from "@angular/material/core";
import { MatFormFieldControl } from "@angular/material/form-field";
import { Subject } from "rxjs";

/**
 * Extend this base class to implement custom input controls to be used as form fields.
 *
 * To use in mat-form-field, add a provider to your component:
 *   `providers: [{ provide: MatFormFieldControl, useExisting: MyCustomComponent }]`
 *
 * ---
 *
 * **When building a subclass you only need the "Reactive API" below:**
 * - {@link formControl} — the bound Angular `FormControl` (when used as an `EditComponent`).
 * - {@link valueSignal} — the current value as a signal (reactive, authoritative in both modes).
 * - {@link enabled} — whether the control is enabled, as a signal.
 * - {@link errorState} — whether the control currently shows an error (for `<mat-error>`).
 *
 * Read state through these signals in your template; do **not** read `formControl.value`
 * or `formControl.enabled` directly (those are not reactive under OnPush).
 *
 * Everything below the "MatFormFieldControl / ControlValueAccessor plumbing" marker implements
 * the Angular Material and Forms contracts and can be ignored when writing a control.
 *
 * also refer to available public resources on Custom Form Controls:
 * - https://material.angular.io/guide/creating-a-custom-form-field-control
 * - https://www.youtube.com/watch?v=CD_t3m2WMM8
 */
@Directive()
export abstract class CustomFormControlDirective<T>
  implements ControlValueAccessor, MatFormFieldControl<T>, OnDestroy, DoCheck
{
  // =========================================================================
  // Reactive API — USE THESE when building a custom control.
  // =========================================================================

  /**
   * The Angular `FormControl` bound to this component when used as an `EditComponent`
   * (i.e. the control provided via {@link ngControl}). Bind it in your template with
   * `[formControl]="formControl"`.
   */
  get formControl(): FormControl<T> {
    return this.ngControl?.control as FormControl<T>;
  }

  /**
   * The current value of the control as a signal.
   * Authoritative in both modes: it reflects the bound `FormControl` (synced in {@link ngDoCheck})
   * as well as `[(value)]` / `writeValue` updates.
   */
  readonly valueSignal: Signal<T> = computed(() => this._value());

  /** Whether the control is currently enabled, as a signal (tracks {@link disabled}). */
  readonly enabled: Signal<boolean> = computed(() => !this._disabled());

  // =========================================================================
  // MatFormFieldControl / ControlValueAccessor plumbing — framework-internal.
  // Subclasses generally do not need to touch anything below this line.
  // =========================================================================

  elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  errorStateMatcher = inject(ErrorStateMatcher);
  private readonly _destroyRef = inject(DestroyRef);
  @Input() ngControl = inject(NgControl, { optional: true, self: true });
  parentForm = inject(NgForm, { optional: true });
  parentFormGroup = inject(FormGroupDirective, { optional: true });

  static nextId = 0;
  id = `custom-form-control-${CustomFormControlDirective.nextId++}`;
  // eslint-disable-next-line @angular-eslint/no-input-rename
  @Input("aria-describedby") userAriaDescribedBy: string;
  @Input() placeholder: string;

  @Input()
  get required() {
    return this._required();
  }

  set required(req: boolean) {
    this._required.set(coerceBooleanProperty(req));
    this.stateChanges.next();
  }

  private readonly _required = signal(false);

  stateChanges = new Subject<void>();
  controlType = "custom-control";
  onChange = (_: any) => {};
  onTouched = () => {};

  /** Backing signal for the current value (single source of truth). */
  private readonly _value = signal<T>(undefined);
  private readonly _disabled = signal(false);
  private readonly _focused = signal(false);
  private readonly _touched = signal(false);
  private readonly _errorState = signal(false);
  private readonly _empty = computed(() => !this._value());

  get focused() {
    return this._focused();
  }

  get touched() {
    return this._touched();
  }

  get errorState() {
    return this._errorState();
  }

  get empty() {
    return this._empty();
  }

  get shouldLabelFloat() {
    return this._focused() || !this._empty();
  }

  @Input()
  get disabled(): boolean {
    return this._disabled();
  }

  set disabled(value: boolean) {
    this._disabled.set(coerceBooleanProperty(value));
    this.stateChanges.next();
  }

  @Input() get value(): T {
    return this._value();
  }

  set value(value: T) {
    this.writeValue(value, true);
  }

  @Output() valueChange = new EventEmitter<T>();

  constructor() {
    if (this.ngControl != null) {
      // register the `writeValue` method with the Angular FormControl
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
    this._focused.set(true);
    this.stateChanges.next();
  }

  blur() {
    this._touched.set(true);
    this._focused.set(false);
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

  /**
   * Implementation for Angular ControlValueAccessor interface
   * that links the form control value to the component value
   * @param value The new value to set
   * @param notifyFormControl Whether to notify the FormControl of this change (for internal updates)
   */
  writeValue(value: T, notifyFormControl = false): void {
    if (JSON.stringify(value) === JSON.stringify(this._value())) return;

    this._value.set(value);
    if (notifyFormControl) {
      this.onChange(value);
    }
    this.valueChange.emit(value);
    this.stateChanges.next();
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

    this.subscribeToControl(control);
    this.checkUpdateValue(control);
    this.checkUpdateDisabled(control);
    this.checkUpdateErrorState(control);
    this.checkUpdateRequired(control);
  }

  private _controlSubscribed = false;

  /**
   * Subscribe to the bound control's value/status streams the first time it appears
   * (`ngControl` may be set late via `setInput`, so we cannot do this in the constructor).
   *
   * This keeps the reactive signals ({@link valueSignal}, {@link enabled}, {@link errorState})
   * in sync *and* marks the OnPush view dirty when the control changes at runtime: writing a
   * signal notifies its template consumers. Relying on {@link ngDoCheck} alone is not enough
   * once the template consumes these signals, because `ngDoCheck` only runs while the view is
   * already being checked — a runtime `disable()` / `setValue()` on the control would otherwise
   * never reach the template.
   */
  private subscribeToControl(control: AbstractControl | null) {
    if (this._controlSubscribed || !control) {
      // standalone mode (no control): writeValue / the value setter drive the signals.
      return;
    }
    this._controlSubscribed = true;

    control.valueChanges
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(() => this.checkUpdateValue(control));
    control.statusChanges
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(() => {
        this.checkUpdateDisabled(control);
        this.checkUpdateErrorState(control);
        this.checkUpdateRequired(control);
      });
  }

  /** Stringified last control value seen, to detect *external* control changes. */
  private _lastControlValueJson: string | undefined;

  /**
   * Mirror the bound control's value into {@link valueSignal}.
   *
   * In `EditComponent` mode the value flows through the control's own value accessor
   * (the inner `[formControl]` binding), so {@link writeValue} is never called on this
   * directive — this keeps {@link valueSignal} authoritative there too.
   *
   * Only mirrors when the control changed *externally* (e.g. via its bound input or a form
   * reset). It deliberately does not overwrite a value the component set on itself but that
   * has not yet propagated to the control (e.g. when no `onChange` is registered).
   * Inbound only: it must not emit `valueChange` / call `onChange`.
   */
  private checkUpdateValue(control: AbstractControl | null) {
    if (!control) {
      // standalone mode: writeValue / the value setter still drive _value
      return;
    }

    const controlValueJson = JSON.stringify(control.value);
    if (controlValueJson === this._lastControlValueJson) {
      return;
    }
    this._lastControlValueJson = controlValueJson;

    if (controlValueJson !== JSON.stringify(this._value())) {
      this._value.set(control.value);
    }
  }

  private checkUpdateDisabled(control: AbstractControl | null) {
    if (!control) {
      return;
    }

    if (this.disabled !== coerceBooleanProperty(control.disabled)) {
      this.disabled = coerceBooleanProperty(control.disabled);
    }
  }

  /**
   * Updates the error state based on the form control
   * Taken from {@link https://github.com/angular/components/blob/a1d5614f18066c0c2dc2580c7b5099e8f68a8e74/src/material/core/common-behaviors/error-state.ts#L59}
   */
  private checkUpdateErrorState(control: AbstractControl | null) {
    const oldState = this._errorState();
    const parent = this.parentFormGroup || this.parentForm;
    const newState = this.errorStateMatcher.isErrorState(control, parent);

    if (newState !== oldState) {
      this._errorState.set(newState);
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
