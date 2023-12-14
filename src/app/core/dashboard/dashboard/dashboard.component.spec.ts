import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DashboardComponent } from "./dashboard.component";
import { DynamicComponentConfig } from "../../config/dynamic-components/dynamic-component-config.interface";
import { EntityAbility } from "../../permissions/ability/entity-ability";

describe("DashboardComponent", () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let ability: EntityAbility;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [EntityAbility],
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

  it("should only display widgets for which a user has permissions", () => {
    const widgets: DynamicComponentConfig[] = [
      { component: "TodosDashboard" },
      { component: "EntityCountDashboard" },
      {
        component: "EntityCountDashboard",
        config: { entity: "School", groupBy: "language" },
      },
      { component: "ShortcutDashboard", config: { shortcuts: [] } },
    ];

    // Some read permissions
    ability.update([
      { subject: "Child", action: "manage" },
      { subject: "Todo", action: ["update", "read"] },
    ]);
    component.widgets = widgets;
    expect(component.widgets).toEqual([widgets[0], widgets[1], widgets[3]]);

    // No read permissions
    ability.update([{ subject: "all", action: "update" }]);
    component.widgets = widgets;
    expect(component.widgets).toEqual([widgets[3]]);

    // All read permissions
    ability.update([{ subject: "all", action: "manage" }]);
    component.widgets = widgets;
    expect(component.widgets).toEqual(widgets);
  });

  it("should show birthday widget if user has access to any provided entity", () => {
    ability.update([{ subject: "Child", action: "read" }]);
    component.widgets = [{ component: "BirthdayDashboard" }];
    expect(component.widgets).toHaveSize(1);

    component.widgets = [
      {
        component: "BirthdayDashboard",
        config: { entities: { User: "birthday" } },
      },
    ];
    expect(component.widgets).toHaveSize(0);

    component.widgets = [
      {
        component: "BirthdayDashboard",
        config: { entities: { User: "birthday", Child: "dateOfBirth" } },
      },
    ];
    expect(component.widgets).toHaveSize(1);
  });

  it("should show widget if user only have access to some entities", () => {
    ability.update([]);
    component.widgets = [{ component: "NotesDashboard" }];
    expect(component.widgets).toHaveSize(0);

    ability.update([
      { subject: "Note", action: "manage", conditions: { category: "VISIT" } },
    ]);
    component.widgets = [{ component: "NotesDashboard" }];
    expect(component.widgets).toHaveSize(1);
  });
});
