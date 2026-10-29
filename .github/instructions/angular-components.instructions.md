---
applyTo: "**/*.component.ts"
paths: "**/*.component.ts"
---

# Angular Component Patterns

Examples for the component rules in `AGENTS.md` (which also covers templates, styling, i18n and legacy code).

## Change Detection

All components **must** use `OnPush` change detection:

```typescript
@Component({
  selector: "app-example",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
```

## Inputs and Outputs

Use `input()` and `output()` functions (Angular signals) — **not** `@Input()` / `@Output()` decorators:

```typescript
export class ExampleComponent {
  title = input<string>(); // optional input
  entity = input.required<Child>(); // required input
  saved = output<Child>(); // output event
}
```

## Dependency Injection

Use `inject()` into a `private readonly` field — **not** constructor injection:

```typescript
export class ExampleComponent {
  private readonly entityMapper = inject(EntityMapperService);
  private readonly route = inject(ActivatedRoute);
}
```

## Signals and Computed State

Use signals for local state and `computed()` for derived values.
Do NOT use `mutate` on signals — use `update` or `set` instead.

Use `linkedSignal` for state that depends on other signals
and `resource` for async data fetching.
Try to avoid init methods to make code easier to read.

## Async Work and the Component Lifetime

A component can be destroyed while one of its `async` methods is still waiting — the user
navigates away, a dialog is closed, a route changes. Everything after an `await` therefore
runs for a view that may no longer exist:

- Registering a destroy callback on a destroyed view throws
  `NG0911: View has already been destroyed.` This covers everything that needs an injection
  context, e.g. `effect()`, `toSignal()`, `runInInjectionContext()` and `DestroyRef.onDestroy()`.
- Writing to signals does not throw, but it is wasted work and can leave a half-finished
  action behind.

So:

- Do the injection-context work **before** the first `await` — e.g. start parallel loads with
  `Promise.all` instead of awaiting one after the other.
- Guard continuations that touch the view with `DestroyRef.destroyed` and simply drop the work:

```typescript
private readonly destroyRef = inject(DestroyRef);

async ngOnInit() {
  const records = await this.entityMapper.loadType(Child);
  if (this.destroyRef.destroyed) {
    return;
  }
  this.records.set(records);
}
```

- For observables use `takeUntilDestroyed()`, which already guards against this internally.

## Template Control Flow

Use native control flow — **not** structural directives (`*ngIf`, `*ngFor`, `*ngSwitch`):

```html
@if (entity(); as entity) {
<app-entity-details [entity]="entity" />
} @for (item of items(); track item.getId()) {
<app-item-card [item]="item" />
} @empty {
<p i18n>No items found.</p>
} @switch (status()) { @case ("active") { <span i18n>Active</span> } @case ("inactive") { <span i18n>Inactive</span> } }
```

## Canonical Component Structure

```typescript
import { Component, ChangeDetectionStrategy, computed, inject, input, output, resource } from "@angular/core";

@Component({
  selector: "app-example",
  templateUrl: "./example.component.html",
  styleUrl: "./example.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, AsyncPipe],
})
export class ExampleComponent {
  // Injected dependencies
  private readonly entityMapper = inject(EntityMapperService);

  // Inputs and outputs
  entity = input.required<Child>();
  relatedEntityId = input.required<string>();
  saved = output<Child>();

  // Derived state
  displayName = computed(() => this.entity().toString());

  // Resource to load data
  relatedEntity = resource({
    params: () => ({ id: this.relatedEntityId() }),
    loader: async ({ params: { id } }) => {
      return await this.entityMapper.load(id);
    },
  });
}
```
