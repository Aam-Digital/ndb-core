import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from "@angular/core/testing";
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

  let mockChildrenService: jasmine.SpyObj<ChildrenService>;
  let mockEntityRemoveService: jasmine.SpyObj<EntityActionsService>;
  let mockAbility: jasmine.SpyObj<EntityAbility>;

  beforeEach(waitForAsync(() => {
    mockChildrenService = jasmine.createSpyObj(["queryRelations"]);
    mockEntityRemoveService = jasmine.createSpyObj(["remove"]);
    mockChildrenService.queryRelations.and.resolveTo([]);
    mockAbility = jasmine.createSpyObj(["cannot", "update", "on"]);
    mockAbility.cannot.and.returnValue(false);
    mockAbility.on.and.returnValue(() => true);

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

  it("sets the panels config with child and creating status", fakeAsync(() => {
    const testChild = new TestEntity("Test-Child");
    testChild["_rev"] = "1"; // mark as "not new"
    TestBed.inject(EntityMapperService).save(testChild);
    tick();
    component.id = testChild.getId(true);
    component.ngOnChanges(simpleChangesFor(component, "id"));
    tick();

    component.panels.forEach((p) =>
      p.components.forEach((c) => {
        const panelConfig = c.config as PanelConfig;
        expect(panelConfig.entity).toEqual(testChild);
        expect(panelConfig.creatingNew).toBeFalse();
      }),
    );
  }));
});

function simpleChangesFor(component, ...properties: string[]) {
  const changes = {};
  for (const p of properties) {
    changes[p] = new SimpleChange(null, component[p], true);
  }
  return changes;
}
