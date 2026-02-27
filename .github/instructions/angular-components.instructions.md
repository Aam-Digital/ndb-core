---
applyTo: "**/*.component.ts"
---

# Angular Component Patterns

> **Legacy code note:** Some existing code may not implement these guidelines yet. For new components, always follow these instructions. For existing components, analyse the status and refactor only after confirmation. Separate refactoring changes into their own commits and PRs.

## Change Detection

All components **must** use `OnPush` change detection:

```typescript
@Component({
  selector: "app-example",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
```

## Inputs and Outputs

Use `input()` and `output()` functions — **not** `@Input()` / `@Output()` decorators:

```typescript
export class ExampleComponent {
  title = input<string>();           // optional input
  entity = input.required<Child>();  // required input
  saved = output<Child>();           // output event
}
```

## Dependency Injection

Use `inject()` — **not** constructor injection:

```typescript
export class ExampleComponent {
  private entityMapper = inject(EntityMapperService);
  private route = inject(ActivatedRoute);
}
```

## Signals and Computed State

Use signals for local state and `computed()` for derived values:

```typescript
export class ExampleComponent {
  items = input.required<Entity[]>();
  filter = signal("");
  filteredItems = computed(() =>
    this.items().filter((item) => item.name.includes(this.filter())),
  );
}
```

Do NOT use `mutate` on signals — use `update` or `set` instead.

## Template Control Flow

Use native control flow — **not** structural directives (`*ngIf`, `*ngFor`, `*ngSwitch`):

```html
@if (entity(); as entity) {
  <app-entity-details [entity]="entity" />
}

@for (item of items(); track item.getId()) {
  <app-item-card [item]="item" />
} @empty {
  <p i18n>No items found.</p>
}

@switch (status()) {
  @case ("active") { <span i18n>Active</span> }
  @case ("inactive") { <span i18n>Inactive</span> }
}
```

## Canonical Component Structure

```typescript
import { Component, ChangeDetectionStrategy, computed, inject, input, output } from "@angular/core";

@Component({
  selector: "app-example",
  templateUrl: "./example.component.html",
  styleUrl: "./example.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, AsyncPipe],
})
export class ExampleComponent {
  // Inputs and outputs
  entity = input.required<Child>();
  saved = output<Child>();

  // Derived state
  displayName = computed(() => this.entity().toString());

  // Injected dependencies
  private entityMapper = inject(EntityMapperService);
}
```

## Component Guidelines

- Keep components small and focused on single responsibility
- Prefer inline templates for small components
- Prefer Reactive forms over Template-driven forms
- Use class bindings instead of `ngClass`
- Use style bindings instead of `ngStyle`
- Use `async` pipe for observables
- Use `customDate` pipe for date formatting with "shortDate" or "mediumDate" format
- Use `$localize` or i18n markers for all user-facing strings
  - Do not add context labels unless the purpose of the i18n string is truly ambiguous without it
- Use `Logging` (from `#src/app/core/logging/logging.service`) — never `console.log`

## SCSS Styling

- Use global variables from `src/styles/` (e.g. `@use "variables/colors"; colors.$primary`)
- Prefer global utility classes (`flex-row`, `margin-regular`) from `src/styles/globals/`
- If custom styles are needed, use meaningful class names in the component SCSS file
