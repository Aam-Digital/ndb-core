import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";
import { EntityDetailsComponent } from "./entity-details.component";
import { EntityDetailsConfig, PanelConfig } from "../EntityDetailsConfig";
import { ChildrenService } from "../../../child-dev-project/children/children.service";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { EntityActionsService } from "../../entity/entity-actions/entity-actions.service";
import { EntityAbility } from "../../permissions/ability/entity-ability";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { TestEntity } from "../../../utils/test-utils/TestEntity";
import type { Mock } from "vitest";

type ChildrenServiceMock = {
  queryRelations: Mock;
};

type EntityActionsServiceMock = {
  remove: Mock;
};

type EntityAbilityMock = {
  can: Mock;
  cannot: Mock;
  update: Mock;
  on: Mock;
};

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

  let mockChildrenService: ChildrenServiceMock;
  let mockEntityRemoveService: EntityActionsServiceMock;
  let mockAbility: EntityAbilityMock;

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

    fixture.componentRef.setInput("entityType", routeConfig.entityType);
    fixture.componentRef.setInput("panels", routeConfig.panels);

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
      await TestBed.inject(EntityMapperService).save(testChild);
      await vi.advanceTimersByTimeAsync(0);
      fixture.componentRef.setInput("id", testChild.getId(true));
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(0);

      component.panelsState.forEach((p) =>
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

  it("updates panel entity reference in configs when entity is saved externally (e.g. after anonymize)", async () => {
    vi.useFakeTimers();
    try {
      const testChild = new TestEntity("Entity-Update-Test");
      testChild["_rev"] = "1";
      const entityMapper = TestBed.inject(EntityMapperService);
      await entityMapper.save(testChild);
      await vi.advanceTimersByTimeAsync(0);

      fixture.componentRef.setInput("id", testChild.getId(true));
      fixture.componentRef.setInput("panels", [
        {
          title: "Test Panel",
          components: [{ title: "", component: "Form", config: {} }],
        },
      ]);
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(0);

      const updatedChild = new TestEntity(testChild.getId(true));
      updatedChild.anonymized = true;
      updatedChild["_rev"] = "2";
      await entityMapper.save(updatedChild);
      await vi.advanceTimersByTimeAsync(0);

      const panelConfig = component.panelsState[0].components[0]
        .config as PanelConfig;
      expect(panelConfig.entity.anonymized).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("filters out panels not permitted for the current user role", async () => {
    vi.useFakeTimers();
    try {
      const testChild = new TestEntity("Role-Test");
      testChild.getConstructor().enableUserAccounts = false;
      component.entity.set(testChild);
      fixture.detectChanges();

      fixture.componentRef.setInput("panels", [
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
      ]);
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(0);

      expect(component.panelsState.length).toBe(2);
      expect(component.panelsState[0].title).toBe("Visible Panel");
    } finally {
      vi.useRealTimers();
    }
  });
});
