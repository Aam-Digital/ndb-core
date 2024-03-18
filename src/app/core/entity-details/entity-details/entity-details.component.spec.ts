import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from "@angular/core/testing";
import { EntityDetailsComponent } from "./entity-details.component";
import { Router } from "@angular/router";
import { EntityDetailsConfig, PanelConfig } from "../EntityDetailsConfig";
import { Child } from "../../../child-dev-project/children/model/child";
import { ChildrenService } from "../../../child-dev-project/children/children.service";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { EntityActionsService } from "../../entity/entity-actions/entity-actions.service";
import { EntityAbility } from "../../permissions/ability/entity-ability";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { SimpleChange } from "@angular/core";

describe("EntityDetailsComponent", () => {
  let component: EntityDetailsComponent;
  let fixture: ComponentFixture<EntityDetailsComponent>;

  const routeConfig: EntityDetailsConfig = {
    entityType: "Child",
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
    const testChild = new Child("Test-Child");
    TestBed.inject(EntityMapperService).save(testChild);
    tick();
    component.creatingNew = false;
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

  it("should load the correct child on startup", fakeAsync(() => {
    component.isLoading = true;
    const testChild = new Child("Test-Child");
    const entityMapper = TestBed.inject(EntityMapperService);
    entityMapper.save(testChild);
    tick();
    spyOn(entityMapper, "load").and.callThrough();

    component.id = testChild.getId(true);
    component.ngOnChanges(simpleChangesFor(component, "id"));
    expect(component.isLoading).toBeTrue();
    tick();

    expect(entityMapper.load).toHaveBeenCalledWith(
      Child,
      testChild.getId(true),
    );
    expect(component.entity).toBe(testChild);
    expect(component.isLoading).toBeFalse();
  }));

  it("should also support the long ID format", fakeAsync(() => {
    const child = new Child();
    const entityMapper = TestBed.inject(EntityMapperService);
    entityMapper.save(child);
    tick();
    spyOn(entityMapper, "load").and.callThrough();

    component.id = child.getId();
    component.ngOnChanges(simpleChangesFor(component, "id"));
    tick();

    expect(entityMapper.load).toHaveBeenCalledWith(Child, child.getId());
    expect(component.entity).toEqual(child);

    // entity is updated
    const childUpdate = child.copy();
    childUpdate.name = "update";
    entityMapper.save(childUpdate);
    tick();

    expect(component.entity).toEqual(childUpdate);
  }));

  it("should call router when user is not permitted to create entities", () => {
    mockAbility.cannot.and.returnValue(true);
    const router = fixture.debugElement.injector.get(Router);
    spyOn(router, "navigate");
    component.id = "new";
    component.ngOnChanges(simpleChangesFor(component, "id"));
    expect(router.navigate).toHaveBeenCalled();
  });
});

function simpleChangesFor(component, ...properties: string[]) {
  const changes = {};
  for (const p of properties) {
    changes[p] = new SimpleChange(null, component[p], true);
  }
  return changes;
}
