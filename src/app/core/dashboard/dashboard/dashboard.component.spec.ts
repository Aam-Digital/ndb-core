import { Component } from "@angular/core";
import {
  ComponentFixture,
  TestBed,
} from "@angular/core/testing";
import { DashboardComponent } from "./dashboard.component";
import { DynamicComponentConfig } from "../../config/dynamic-components/dynamic-component-config.interface";
import { EntityAbility } from "../../permissions/ability/entity-ability";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { SessionSubject } from "../../session/auth/session-info";
import { EntityCountDashboardConfig } from "app/features/dashboard-widgets/entity-count-dashboard-widget/entity-count-dashboard/entity-count-dashboard.component";
import { ComponentRegistry } from "../../../dynamic-components";

@Component({ selector: "mock-todos-dashboard", template: "", standalone: true })
class MockTodosDashboardComponent {
  static getRequiredEntities(): string {
    return "Todo";
  }
}

@Component({
  selector: "mock-entity-count-dashboard",
  template: "",
  standalone: true,
})
class MockEntityCountDashboardComponent {
  static getRequiredEntities(config?: EntityCountDashboardConfig): string {
    return config?.entityType ?? "Child";
  }
}

@Component({
  selector: "mock-birthday-dashboard",
  template: "",
  standalone: true,
})
class MockBirthdayDashboardComponent {
  static getRequiredEntities(config?: { entities?: Record<string, string> }): string[] {
    return config?.entities ? Object.keys(config.entities) : ["Child"];
  }
}

@Component({ selector: "mock-notes-dashboard", template: "", standalone: true })
class MockNotesDashboardComponent {
  static getRequiredEntities(): string {
    return "Note";
  }
}

@Component({
  selector: "mock-shortcut-dashboard",
  template: "",
  standalone: true,
})
class MockShortcutDashboardComponent {}

@Component({ selector: "mock-generic-dashboard", template: "", standalone: true })
class MockGenericDashboardComponent {}

describe("DashboardComponent", () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let ability: EntityAbility;
  let mockComponentRegistry: ComponentRegistry;

  beforeEach(() => {
    mockComponentRegistry = new ComponentRegistry();
    mockComponentRegistry.allowDuplicates();
    const originalGet = mockComponentRegistry.get.bind(mockComponentRegistry);
    const mockedWidgets: Record<string, () => Promise<any>> = {
      TodosDashboard: async () => MockTodosDashboardComponent,
      EntityCountDashboard: async () => MockEntityCountDashboardComponent,
      BirthdayDashboard: async () => MockBirthdayDashboardComponent,
      NotesDashboard: async () => MockNotesDashboardComponent,
      ShortcutDashboard: async () => MockShortcutDashboardComponent,
    };

    vi.spyOn(mockComponentRegistry, "get").mockImplementation((name: string) => {
      if (mockedWidgets[name]) {
        return mockedWidgets[name];
      }

      try {
        return originalGet(name);
      } catch {
        return async () => MockGenericDashboardComponent;
      }
    });

    TestBed.configureTestingModule({
      imports: [DashboardComponent, MockedTestingModule.withState()],
      providers: [{ provide: ComponentRegistry, useValue: mockComponentRegistry }],
    }).compileComponents();
    ability = TestBed.inject(EntityAbility);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  async function setWidgetsAndStabilize(widgets: DynamicComponentConfig[]) {
    component.widgets = widgets;
    fixture.detectChanges();
    await fixture.whenStable();
    await Promise.resolve();
    fixture.detectChanges();
  }

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should only display widgets for which a user has permissions", async () => {
    const widgets: DynamicComponentConfig[] = [
      { component: "TodosDashboard" },
      { component: "EntityCountDashboard" },
      {
        component: "EntityCountDashboard",
        config: {
          entityType: "School",
          groupBy: ["language"],
        } as EntityCountDashboardConfig,
      },
      { component: "ShortcutDashboard", config: { shortcuts: [] } },
    ];

    // Some read permissions
    ability.update([
      { subject: "Child", action: "manage" },
      { subject: "Todo", action: ["update", "read"] },
    ]);
    await setWidgetsAndStabilize(widgets);
    await vi.waitFor(() =>
      expect(component.widgets).toEqual([widgets[0], widgets[1], widgets[3]]),
    );

    // No read permissions
    ability.update([{ subject: "all", action: "update" }]);
    await setWidgetsAndStabilize(widgets);
    await vi.waitFor(() => expect(component.widgets).toEqual([widgets[3]]));

    // All read permissions
    ability.update([{ subject: "all", action: "manage" }]);
    await setWidgetsAndStabilize(widgets);
    await vi.waitFor(() => expect(component.widgets).toEqual(widgets));
  });

  it("should show birthday widget if user has access to any provided entity", async () => {
    ability.update([{ subject: "Child", action: "read" }]);
    await setWidgetsAndStabilize([{ component: "BirthdayDashboard" }]);
    await vi.waitFor(() => expect(component.widgets).toHaveLength(1));

    await setWidgetsAndStabilize([
      {
        component: "BirthdayDashboard",
        config: { entities: { User: "birthday" } },
      },
    ]);
    await vi.waitFor(() => expect(component.widgets).toHaveLength(0));

    await setWidgetsAndStabilize([
      {
        component: "BirthdayDashboard",
        config: { entities: { User: "birthday", Child: "dateOfBirth" } },
      },
    ]);
    await vi.waitFor(() => expect(component.widgets).toHaveLength(1));
  });

  it("should show widget if user only have access to some entities", async () => {
    ability.update([]);
    await setWidgetsAndStabilize([{ component: "NotesDashboard" }]);
    await vi.waitFor(() => expect(component.widgets).toHaveLength(0));

    ability.update([
      { subject: "Note", action: "manage", conditions: { category: "VISIT" } },
    ]);
    await setWidgetsAndStabilize([{ component: "NotesDashboard" }]);
    await vi.waitFor(() => expect(component.widgets).toHaveLength(1));
  });

  it("should hide widgets if the user is missing the required role", async () => {
    ability.update([{ subject: "all", action: "manage" }]);
    const session = TestBed.inject(SessionSubject);
    const widgets = [
      { component: "TodosDashboard", permittedUserRoles: ["admin_app"] },
      { component: "EntityCountDashboard" },
    ];

    session.next({ name: "not_admin", id: "1", roles: ["user_app"] });
    await setWidgetsAndStabilize(widgets);
    await vi.waitFor(() => expect(component.widgets).toEqual([widgets[1]]));

    session.next({ name: "admin", id: "2", roles: ["user_app", "admin_app"] });
    await setWidgetsAndStabilize(widgets);
    await vi.waitFor(() => expect(component.widgets).toEqual(widgets));
  });
});
