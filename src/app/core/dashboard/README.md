# Dashboard Widgets

## Creating a Custom Widget

1. Create a standalone Angular component with `OnPush` change detection.
2. Register it with `@DynamicComponent("YourWidgetName")` so it can be referenced from config.
3. Use `input()` signals for any configuration properties (these are set from the dashboard config).
4. For list-style widgets, wrap your template with `<app-dashboard-list-widget>` (see `DashboardListWidgetComponent`).

```typescript
@DynamicComponent("MyCustomDashboard")
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-my-custom-dashboard",
  template: `...`,
  imports: [DashboardListWidgetComponent],
})
export class MyCustomDashboardComponent {
  someConfig = input<string>();
}
```

## Entity Permission Checks

If your widget should only be visible to users with access to a specific entity type, add a **static** `getRequiredEntities` method to your component class.
The dashboard checks for this via duck-typing (`typeof comp.getRequiredEntities === "function"`) — no base class or interface is needed.

```typescript
export class MyCustomDashboardComponent {
  static getRequiredEntities(config?: MyWidgetConfig): string | string[] {
    return config?.entityType ?? "Child";
  }
}
```

If the method is absent, the widget is shown regardless of entity permissions.

## Registering a Settings Component

To provide an admin UI for configuring your widget, register it via `DashboardWidgetRegistryService` in your widget's module.
