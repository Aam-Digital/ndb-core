import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";
import { EntityDetailsComponent } from "./entity-details.component";
import { EntityDetailsConfig, PanelConfig } from "../EntityDetailsConfig";
import { ChildrenService } from "../../../child-dev-project/children/children.service";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { EntityActionsService } from "../../entity/entity-actions/entity-actions.service";
import { EntityAbility } from "../../permissions/ability/entity-ability";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { SimpleChange } from "@angular/core";
import { TestEntity } from "../../../utils/test-utils/TestEntity";

describe("EntityDetailsComponent", () => {
  let component: EntityDetailsComponent;
  let fixture: ComponentFixture<EntityDetailsComponent>;

  const routeConfig: EntityDetailsConfig = {
    entityType: TestEntity.ENTITY_TYPE,
    panels: [
      {
        title: "One Form",
        components: [
          {
            title: "",
            component: "Form",
            config: { cols: [[]] },
          },
        ],
      },
      {
        title: "Two Components",
        components: [
          { title: "First Component", component: "PreviousSchools" },
          { title: "Second Component", component: "Aser" },
        ],
      },
    ],
  };

  let mockChildrenService: any;
  let mockEntityRemoveService: any;
  let mockAbility: any;

  beforeEach(waitForAsync(() => {
    mockChildrenService = {
      queryRelations: vi.fn(),
    };
    mockEntityRemoveService = {
      remove: vi.fn(),
    };
    mockChildrenService.queryRelations.mockResolvedValue([]);
    mockAbility = {
      can: vi.fn(),
      cannot: vi.fn(),
      update: vi.fn(),
      on: vi.fn(),
    };
    mockAbility.can.mockReturnValue(true);
    mockAbility.cannot.mockReturnValue(false);
    mockAbility.on.mockReturnValue(() => true);

    TestBed.configureTestingModule({
      imports: [EntityDetailsComponent, MockedTestingModule.withState()],
      providers: [
        { provide: ChildrenService, useValue: mockChildrenService },
        { provide: EntityActionsService, useValue: mockEntityRemoveService },
        { provide: EntityAbility, useValue: mockAbility },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EntityDetailsComponent);
    component = fixture.componentInstance;

    Object.assign(component, routeConfig);
    component.ngOnChanges(
      simpleChangesFor(component, ...Object.keys(routeConfig)),
    );

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("sets the panels config with child and creating status", async () => {
    vi.useFakeTimers();
    try {
      const testChild = new TestEntity("Test-Child");
      testChild["_rev"] = "1"; // mark as "not new"
      TestBed.inject(EntityMapperService).save(testChild);
      await vi.advanceTimersByTimeAsync(0);
      component.id = testChild.getId(true);
      component.ngOnChanges(simpleChangesFor(component, "id"));
      await vi.advanceTimersByTimeAsync(0);

      component.panels.forEach((p) =>
        p.components.forEach((c) => {
          const panelConfig = c.config as PanelConfig;
          expect(panelConfig.entity).toEqual(testChild);
          expect(panelConfig.creatingNew).toBe(false);
        }),
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("filters out panels not permitted for the current user role", async () => {
    vi.useFakeTimers();
    try {
      const testChild = new TestEntity("Role-Test");
      testChild.getConstructor().enableUserAccounts = false;

      TestBed.inject(EntityMapperService).save(testChild);
      await vi.advanceTimersByTimeAsync(0);
      component.id = testChild.getId(true);

      component.panels = [
        {
          title: "Visible Panel",
          components: [
            { title: "Component A", component: "TestComponent", config: {} },
          ],
          permittedUserRoles: ["user_app"],
        },
        {
          title: "Hidden Panel",
          components: [
            { title: "Component B", component: "TestComponent", config: {} },
          ],
          permittedUserRoles: ["admin_app"],
        },
        {
          title: "Default Panel (without stating permitted roles)",
          components: [
            { title: "Component C", component: "TestComponent", config: {} },
          ],
        },
      ];
      component.ngOnChanges(simpleChangesFor(component, "id", "panels"));
      await vi.advanceTimersByTimeAsync(0);

      expect(component.panels.length).toBe(2);
      expect(component.panels[0].title).toBe("Visible Panel");
    } finally {
      vi.useRealTimers();
    }
  });
});

function simpleChangesFor(component, ...properties: string[]) {
  const changes = {};
  for (const p of properties) {
    changes[p] = new SimpleChange(null, component[p], true);
  }
  return changes;
}
