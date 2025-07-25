import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import { DashboardComponent } from "./dashboard.component";
import { DynamicComponentConfig } from "../../config/dynamic-components/dynamic-component-config.interface";
import { EntityAbility } from "../../permissions/ability/entity-ability";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { SessionSubject } from "../../session/auth/session-info";
import { EntityCountDashboardConfig } from "app/features/dashboard-widgets/entity-count-dashboard-widget/entity-count-dashboard/entity-count-dashboard.component";

describe("DashboardComponent", () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let ability: EntityAbility;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DashboardComponent, MockedTestingModule.withState()],
    }).compileComponents();
    ability = TestBed.inject(EntityAbility);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should only display widgets for which a user has permissions", fakeAsync(() => {
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
    component.widgets = widgets;
    tick();
    expect(component.widgets).toEqual([widgets[0], widgets[1], widgets[3]]);

    // No read permissions
    ability.update([{ subject: "all", action: "update" }]);
    component.widgets = widgets;
    tick();
    expect(component.widgets).toEqual([widgets[3]]);

    // All read permissions
    ability.update([{ subject: "all", action: "manage" }]);
    component.widgets = widgets;
    tick();
    expect(component.widgets).toEqual(widgets);
  }));

  it("should show birthday widget if user has access to any provided entity", fakeAsync(() => {
    ability.update([{ subject: "Child", action: "read" }]);
    component.widgets = [{ component: "BirthdayDashboard" }];
    tick();
    expect(component.widgets).toHaveSize(1);

    component.widgets = [
      {
        component: "BirthdayDashboard",
        config: { entities: { User: "birthday" } },
      },
    ];
    tick();
    expect(component.widgets).toHaveSize(0);

    component.widgets = [
      {
        component: "BirthdayDashboard",
        config: { entities: { User: "birthday", Child: "dateOfBirth" } },
      },
    ];
    tick();
    expect(component.widgets).toHaveSize(1);
  }));

  it("should show widget if user only have access to some entities", fakeAsync(() => {
    ability.update([]);
    component.widgets = [{ component: "NotesDashboard" }];
    tick();
    expect(component.widgets).toHaveSize(0);

    ability.update([
      { subject: "Note", action: "manage", conditions: { category: "VISIT" } },
    ]);
    component.widgets = [{ component: "NotesDashboard" }];
    tick();
    expect(component.widgets).toHaveSize(1);
  }));

  it("should hide widgets if the user is missing the required role", fakeAsync(() => {
    ability.update([{ subject: "all", action: "manage" }]);
    const session = TestBed.inject(SessionSubject);
    const widgets = [
      { component: "TodosDashboard", permittedUserRoles: ["admin_app"] },
      { component: "EntityCountDashboard" },
    ];

    session.next({ name: "not_admin", id: "1", roles: ["user_app"] });
    component.widgets = widgets;
    tick();
    expect(component.widgets).toEqual([widgets[1]]);

    session.next({ name: "admin", id: "2", roles: ["user_app", "admin_app"] });
    component.widgets = widgets;
    tick();
    expect(component.widgets).toEqual(widgets);
  }));
});
