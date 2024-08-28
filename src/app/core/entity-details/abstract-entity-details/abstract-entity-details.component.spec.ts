import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from "@angular/core/testing";
import { AbstractEntityDetailsComponent } from "./abstract-entity-details.component";
import { Router } from "@angular/router";
import { EntityDetailsConfig } from "../EntityDetailsConfig";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { EntityActionsService } from "../../entity/entity-actions/entity-actions.service";
import { EntityAbility } from "../../permissions/ability/entity-ability";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { Component, SimpleChange } from "@angular/core";
import { mockEntityMapper } from "../../entity/entity-mapper/mock-entity-mapper-service";
import { TestEntity } from "../../../utils/test-utils/TestEntity";

@Component({
  template: ``,
  standalone: true,
})
class TestEntityDetailsComponent extends AbstractEntityDetailsComponent {}

describe("AbstractEntityDetailsComponent", () => {
  let component: TestEntityDetailsComponent;
  let fixture: ComponentFixture<TestEntityDetailsComponent>;

  const routeConfig: EntityDetailsConfig = {
    entityType: TestEntity.ENTITY_TYPE,
    panels: [],
  };

  let mockEntityRemoveService: jasmine.SpyObj<EntityActionsService>;
  let mockAbility: jasmine.SpyObj<EntityAbility>;

  beforeEach(waitForAsync(() => {
    mockEntityRemoveService = jasmine.createSpyObj(["remove"]);
    mockAbility = jasmine.createSpyObj(["cannot", "update", "on"]);
    mockAbility.cannot.and.returnValue(false);
    mockAbility.on.and.returnValue(() => true);

    TestBed.configureTestingModule({
      imports: [TestEntityDetailsComponent, MockedTestingModule.withState()],
      providers: [
        { provide: EntityMapperService, useValue: mockEntityMapper() },
        { provide: EntityActionsService, useValue: mockEntityRemoveService },
        { provide: EntityAbility, useValue: mockAbility },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestEntityDetailsComponent);
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

  it("should load the correct entity on init", fakeAsync(() => {
    component.isLoading = true;
    const testChild = new TestEntity("Test-Child");
    const entityMapper = TestBed.inject(EntityMapperService);
    entityMapper.save(testChild);
    tick();
    spyOn(entityMapper, "load").and.callThrough();

    component.id = testChild.getId(true);
    component.ngOnChanges(simpleChangesFor(component, "id"));
    expect(component.isLoading).toBeTrue();
    tick();

    expect(entityMapper.load).toHaveBeenCalledWith(
      TestEntity,
      testChild.getId(true),
    );
    expect(component.entity).toBe(testChild);
    expect(component.isLoading).toBeFalse();
  }));

  it("should also support the long ID format", fakeAsync(() => {
    const child = new TestEntity();
    const entityMapper = TestBed.inject(EntityMapperService);
    entityMapper.save(child);
    tick();
    spyOn(entityMapper, "load").and.callThrough();

    component.id = child.getId();
    component.ngOnChanges(simpleChangesFor(component, "id"));
    tick();

    expect(entityMapper.load).toHaveBeenCalledWith(TestEntity, child.getId());
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
