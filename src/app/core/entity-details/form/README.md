# Entity Form components

The following hierarchy of components are building an entity details form:

- `FormComponent` provides actions (save, cancel) wrapper and builds an overall form control
- `EntityFormComponent` provides a form layout (field groups, individual fields)
- `EntityFieldEditComponent` provides one form field (including general label, help tooltip, errors)
- `DynamicEditComponent` is a `CustomFormControlDirective` that dynamically loads and wraps a form control implementation for the custom datatypes
  - uses `appDynamicComponent` for our component registry and passes on ngControl,formFieldConfig and entity
- custom `Edit...Component` implementations are also `CustomFormControlDirective`

## Creating a custom form control

Custom inputs (the `Edit...Component` implementations and standalone controls like
`BasicAutocompleteComponent` / `ColorInputComponent`) extend
[`CustomFormControlDirective<T>`](../../common-components/basic-autocomplete/custom-form-control.directive.ts).
The base class implements the `MatFormFieldControl` and `ControlValueAccessor` contracts for you.

### Setup

```ts
// @DynamicComponent registers the component (only needed for datatype edit components)
@DynamicComponent("EditText")
@Component({
  selector: "app-edit-text",
  templateUrl: "./edit-text.component.html",
  // the provider lets the surrounding <mat-form-field> use this component as its control
  providers: [{ provide: MatFormFieldControl, useExisting: EditTextComponent }],
})
// implement EditComponent for components loaded via DynamicEditComponent
export class EditTextComponent extends CustomFormControlDirective<string> implements EditComponent {
  formFieldConfig = input<FormFieldConfig>();
}
```

```html
<input [formControl]="formControl" matInput type="text" />
```

### The reactive API to use

When building a subclass you only need these members (everything else is framework plumbing):

- **`formControl`** — the bound Angular `FormControl`. Bind your input with `[formControl]="formControl"`.
- **`valueSignal()`** — the current value as a signal. Authoritative in both modes; use it in
  `computed()`/templates instead of reading `formControl.value`.
- **`enabled()`** — whether the control is enabled, as a signal. Use it instead of `formControl.enabled`/`.disabled`.
- **`errorState`** — whether the control currently shows an error (for `<mat-error>`).

> **Rule:** read state through the signals (`valueSignal()`, `enabled()`), **not** through
> `formControl.value` / `formControl.enabled` directly — the latter are not reactive under
> `ChangeDetectionStrategy.OnPush`.

The `MatFormFieldControl` / `ControlValueAccessor` members (`value`, `empty`, `writeValue`,
`stateChanges`, `ngDoCheck`, …) are implemented by the base class and can be ignored.

### The two modes

A `CustomFormControlDirective` works in two ways, and the reactive API behaves the same in both:

- **EditComponent mode** — loaded by `DynamicEditComponent` for a datatype; the value lives in the
  injected `FormControl` (`formControl`). The base class syncs `valueSignal` from that control.
- **Standalone mode** — used directly with two-way binding, e.g. `[(value)]="..."`; the value lives
  in the base class and `valueChange` is emitted on change.
