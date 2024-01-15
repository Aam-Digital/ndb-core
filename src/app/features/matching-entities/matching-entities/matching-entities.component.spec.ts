import {
  ComponentFixture,
  fakeAsync,
  flush,
  TestBed,
  tick,
  waitForAsync,
} from "@angular/core/testing";

import { MatchingEntitiesComponent } from "./matching-entities.component";
import { MatchingEntitiesConfig } from "./matching-entities-config";
import { Entity } from "../../../core/entity/model/entity";
import { EntityMapperService } from "../../../core/entity/entity-mapper/entity-mapper.service";
import { Child } from "../../../child-dev-project/children/model/child";
import { ChildSchoolRelation } from "../../../child-dev-project/children/model/childSchoolRelation";
import { ActivatedRoute } from "@angular/router";
import { FormDialogService } from "../../../core/form-dialog/form-dialog.service";
import { ConfigService } from "../../../core/config/config.service";
import { BehaviorSubject, NEVER, Subject } from "rxjs";
import { FormFieldConfig } from "../../../core/common-components/entity-form/FormConfig";
import { Coordinates } from "../../location/coordinates";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { School } from "../../../child-dev-project/schools/model/school";
import { DynamicComponentConfig } from "../../../core/config/dynamic-components/dynamic-component-config.interface";
import { Note } from "../../../child-dev-project/notes/model/note";

describe("MatchingEntitiesComponent", () => {
  let component: MatchingEntitiesComponent;
  let fixture: ComponentFixture<MatchingEntitiesComponent>;

  let routeData: Subject<DynamicComponentConfig<MatchingEntitiesConfig>>;
  let mockConfigService: jasmine.SpyObj<ConfigService>;

  let testConfig: MatchingEntitiesConfig = {
    columns: [],
    onMatch: {
      newEntityMatchPropertyLeft: "schoolId",
      newEntityMatchPropertyRight: "childId",
      newEntityType: ChildSchoolRelation.ENTITY_TYPE,
    },
    matchActionLabel: "match test",
    rightSide: { entityType: "Child" },
    leftSide: { entityType: "School" },
  };

  beforeEach(waitForAsync(() => {
    routeData = new Subject();
    mockConfigService = jasmine.createSpyObj(["getConfig"], {
      configUpdates: NEVER,
    });

    TestBed.configureTestingModule({
      imports: [MatchingEntitiesComponent, MockedTestingModule.withState()],
      providers: [
        { provide: ActivatedRoute, useValue: { data: routeData } },
        { provide: FormDialogService, useValue: null },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compileComponents();
  }));

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(MatchingEntitiesComponent);
    component = fixture.componentInstance;
  }));

  it("should create and map dynamic config to inputs", () => {
    Object.assign(component, testConfig);
    component.entity = new Entity();
    fixture.detectChanges();

    expectConfigToMatch(component, testConfig);
  });

  it("should create and map config from active route as alternative to dynamic config", () => {
    routeData.next({ config: testConfig });
    fixture.detectChanges();

    expectConfigToMatch(component, testConfig);
  });

  it("should use central default config and overwrite with dynamic config of the component", () => {
    testConfig.columns = [["defaultA", "defaultB"]];
    mockConfigService.getConfig.and.returnValue(testConfig);

    fixture = TestBed.createComponent(MatchingEntitiesComponent);
    component = fixture.componentInstance;
    component.entity = new Entity();
    fixture.detectChanges();

    expectConfigToMatch(component, testConfig);

    const currentConfig: MatchingEntitiesConfig = {
      columns: [["newA", "newB"]],
    };
    Object.assign(component, currentConfig);
    component.ngOnInit();

    const expectedCombinedConfig = Object.assign({}, testConfig, currentConfig);
    expectConfigToMatch(component, expectedCombinedConfig);
  });

  it("should assign config entity to the selected entity of the side not having a table with select options", fakeAsync(() => {
    const testEntity = new Entity("1");
    component.entity = testEntity;
    component.rightSide = { entityType: "Child" };
    component.onMatch = testConfig.onMatch;
    fixture.detectChanges();
    tick();

    expect(component.sideDetails[0].selected).toEqual([testEntity]);

    component.leftSide = { entityType: "Child" };
    component.rightSide = {};
    component.ngOnInit();
    tick();

    expect(component.sideDetails[1].selected).toEqual([testEntity]);
  }));

  it("should init details for template including available entities table and its columns", fakeAsync(() => {
    const testEntity = new Entity();
    component.entity = testEntity;
    component.rightSide = { entityType: "Child" };
    component.onMatch = testConfig.onMatch;
    component.columns = [
      ["_id", "name"],
      ["_rev", "phone"],
    ];
    const allChildren: Child[] = [Child.create("1"), Child.create("2")];
    const loadTypeSpy = spyOn(TestBed.inject(EntityMapperService), "loadType");
    loadTypeSpy.and.resolveTo(allChildren);

    fixture.detectChanges();
    tick();

    expect(component.sideDetails.length).toBe(2);

    expect(component.sideDetails[0].selected).toEqual([testEntity]);
    expect(component.sideDetails[0].entityType).toEqual(
      testEntity.getConstructor(),
    );
    expect(component.sideDetails[0].availableEntities).toBeUndefined();
    expect(component.sideDetails[0].columns).toEqual(["_id", "_rev"]);

    expect(component.sideDetails[1].selected).toBeUndefined();
    expect(component.sideDetails[1].entityType).toEqual(Child);
    expect(loadTypeSpy).toHaveBeenCalledWith(Child);
    expect(component.sideDetails[1].availableEntities).toEqual(allChildren);
    expect(component.sideDetails[1].columns).toEqual(["name", "phone"]);
  }));

  it("should select only one entity at a time in single select mode", fakeAsync(() => {
    const matchedEntity = Child.create("matched child");
    const otherMatchedEntity = Child.create("second matched child");

    Object.assign(component, testConfig);
    component.onMatch = {
      newEntityType: ChildSchoolRelation.ENTITY_TYPE,
      newEntityMatchPropertyRight: "childId",
      newEntityMatchPropertyLeft: "schoolId",
    };
    fixture.detectChanges();
    tick();
    const testedSide = component.sideDetails[1];

    testedSide.selectMatch(matchedEntity);
    expect(testedSide.selected).toEqual([matchedEntity]);

    testedSide.selectMatch(otherMatchedEntity);
    expect(testedSide.selected).toEqual([otherMatchedEntity]);
  }));

  it("should select multiple entities in multiSelect mode", fakeAsync(() => {
    const matchedEntity = Child.create("matched child");
    const otherMatchedEntity = Child.create("second matched child");

    Object.assign(component, testConfig);
    component.onMatch = {
      newEntityType: Note.ENTITY_TYPE,
      newEntityMatchPropertyRight: "children",
      newEntityMatchPropertyLeft: "schools",
    };
    fixture.detectChanges();
    tick();
    const testedSide = component.sideDetails[1];

    testedSide.selectMatch(matchedEntity);
    testedSide.selectMatch(otherMatchedEntity);
    expect(testedSide.selected).toEqual([matchedEntity, otherMatchedEntity]);

    testedSide.selectMatch(matchedEntity); // deselect by second click
    expect(testedSide.selected).toEqual([otherMatchedEntity]);
  }));

  it("should create a new entity onMatch, with single entity property", fakeAsync(() => {
    const testEntity = new Entity();
    const matchedEntity = Child.create("matched child");
    component.entity = testEntity;
    Object.assign(component, testConfig);
    component.onMatch = {
      newEntityType: ChildSchoolRelation.ENTITY_TYPE,
      newEntityMatchPropertyRight: "childId",
      newEntityMatchPropertyLeft: "schoolId",
    };
    component.columns = [["_id", "name"]];
    const saveSpy = spyOn(TestBed.inject(EntityMapperService), "save");

    fixture.detectChanges();
    tick();
    component.sideDetails[0].selected = [testEntity];
    component.sideDetails[1].selected = [matchedEntity];

    component.createMatch();
    tick();

    expect(saveSpy).toHaveBeenCalledWith(
      jasmine.objectContaining({
        schoolId: testEntity.getId(false),
        childId: matchedEntity.getId(false),
        name:
          "ChildSchoolRelation " + testEntity.toString() + " - matched child",
      } as Partial<ChildSchoolRelation>),
    );
    expect(saveSpy).toHaveBeenCalledWith(jasmine.any(ChildSchoolRelation));
  }));

  it("should create a new entity onMatch, with multiSelect entity-array property", fakeAsync(() => {
    const testEntity = new Entity();
    const child1 = Child.create("matched child 1");
    const child2 = Child.create("matched child 2");

    Object.assign(component, testConfig);
    component.onMatch = {
      newEntityType: Note.ENTITY_TYPE,
      newEntityMatchPropertyRight: "children",
      newEntityMatchPropertyLeft: "schools",
    };
    component.entity = testEntity;
    component.columns = [["_id", "name"]];
    const saveSpy = spyOn(TestBed.inject(EntityMapperService), "save");
    fixture.detectChanges();
    tick();

    component.sideDetails[0].selected = [testEntity];
    component.sideDetails[1].selected = [child1, child2];

    component.createMatch();
    tick();

    expect(saveSpy).toHaveBeenCalledWith(
      jasmine.objectContaining({
        schools: [testEntity.getId(false)],
        children: [child1.getId(false), child2.getId(false)],
        name:
          "Note " +
          testEntity.toString() +
          " - matched child 1, matched child 2",
      } as Partial<ChildSchoolRelation>),
    );
    expect(saveSpy).toHaveBeenCalledWith(jasmine.any(Note));
  }));

  it("should create distance column and publish updates", fakeAsync(() => {
    Child.schema.set("address", { dataType: "location" });
    component.entity = new Child();
    component.columns = [[undefined, "distance"]];
    component.leftSide = { entityType: Child };
    component.onMatch = testConfig.onMatch;

    fixture.detectChanges();
    tick();

    const distanceColumn = component.columns[0][1] as FormFieldConfig;
    expect(distanceColumn).toEqual({
      id: "distance",
      label: "Distance",
      viewComponent: "DisplayDistance",
      additional: {
        coordinatesProperties: ["address"],
        compareCoordinates: jasmine.any(BehaviorSubject),
      },
    });

    let newCoordinates: Coordinates[];
    distanceColumn.additional.compareCoordinates.subscribe(
      (res) => (newCoordinates = res),
    );

    const compare = new Child();
    compare["address"] = { lat: 52, lon: 13 };

    component.sideDetails[0].selectMatch(compare);

    expect(newCoordinates).toEqual([compare["address"]]);

    Child.schema.delete("address");
  }));

  it("should select an entity if it has been selected in the map", fakeAsync(() => {
    component.entity = new Entity();
    component.rightSide = { entityType: "Child" };
    component.onMatch = testConfig.onMatch;
    fixture.detectChanges();
    tick();

    const child = new Child();
    component.entityInMapClicked(child);

    expect(component.sideDetails[1].selected).toEqual([child]);
  }));

  it("should not change the provided config object directly", fakeAsync(() => {
    Object.assign(component, testConfig);
    fixture.detectChanges();
    tick();
    const selectedChild = new Child();
    component.sideDetails[1].selectMatch(selectedChild);
    expect(component.sideDetails[1].selected).toEqual([selectedChild]);

    const newFixture = TestBed.createComponent(MatchingEntitiesComponent);
    const newComponent = newFixture.componentInstance;
    newComponent.entity = new Entity();
    Object.assign(newComponent, testConfig);
    newFixture.detectChanges();
    tick();

    expect(newComponent.sideDetails[1].selected).not.toEqual([selectedChild]);
  }));

  it("should update the distance calculation when the selected map properties change", fakeAsync(() => {
    Object.assign(component, testConfig);
    Child.schema.set("address", { dataType: "location" });
    Child.schema.set("otherAddress", { dataType: "location" });
    School.schema.set("address", { dataType: "location" });
    const leftEntity = new Child();
    leftEntity["address"] = { lat: 52, lon: 14 };
    leftEntity["otherAddress"] = { lat: 53, lon: 14 };
    const rightEntity1 = new School();
    rightEntity1["address"] = { lat: 52, lon: 13 };
    const rightEntity2 = new School();
    rightEntity2["address"] = { lat: 53, lon: 13 };
    spyOn(TestBed.inject(EntityMapperService), "loadType").and.resolveTo([
      rightEntity1,
      rightEntity2,
    ]);
    component.entity = leftEntity;
    component.columns = [];
    component.leftSide = {
      columns: ["distance"],
    };
    component.rightSide = {
      columns: ["distance"],
      entityType: "School",
    };
    fixture.detectChanges();
    tick();
    const leftSide = component.sideDetails[0];
    const rightSide = component.sideDetails[1];
    let lastLeftValue: Coordinates[];
    let lastRightValue: Coordinates[];
    leftSide.distanceColumn.compareCoordinates.subscribe(
      (res) => (lastLeftValue = res),
    );
    rightSide.distanceColumn.compareCoordinates.subscribe(
      (res) => (lastRightValue = res),
    );

    expect(lastLeftValue).toEqual([]);
    expect(lastRightValue).toEqual([
      leftEntity["address"],
      leftEntity["otherAddress"],
    ]);

    // values should be emitted again
    lastLeftValue = undefined;
    lastRightValue = undefined;
    // select only one property
    component.displayedProperties["Child"] = ["address"];
    component.updateMarkersAndDistances();

    expect(lastLeftValue).toEqual([]);
    expect(lastRightValue).toEqual([leftEntity["address"]]);

    // select an entity for right
    rightSide.selectMatch(rightEntity1);

    expect(lastLeftValue).toEqual([rightEntity1["address"]]);
    expect(lastRightValue).toEqual([leftEntity["address"]]);

    lastLeftValue = undefined;
    lastRightValue = undefined;
    //select both properties
    component.displayedProperties["Child"] = ["address", "otherAddress"];
    component.updateMarkersAndDistances();

    expect(lastLeftValue).toEqual([rightEntity1["address"]]);
    expect(lastRightValue).toEqual([
      leftEntity["address"],
      leftEntity["otherAddress"],
    ]);

    Child.schema.delete("otherAddress");
    Child.schema.delete("address");
    School.schema.delete("address");
    flush();
  }));

  it("should only display filtered entities in the map", fakeAsync(() => {
    const c1 = new Child();
    c1.status = "active";
    const c2 = new Child();
    c2.status = "inactive";
    c2.dropoutDate = new Date();
    const c3 = new Child();
    c3.status = "inactive";
    const other = new School();
    TestBed.inject(EntityMapperService).saveAll([c1, c2, c3, other]);
    tick();
    component.leftSide = {
      entityType: "Child",
      prefilter: { dropoutDate: { $exists: false } } as any,
      columns: ["status"],
    };
    component.rightSide = {
      entityType: "School",
      columns: ["_id"],
    };
    component.onMatch = testConfig.onMatch;
    fixture.detectChanges();
    tick();

    expect(component.filteredMapEntities.map((entity) => entity)).toEqual([
      c1,
      c3,
      other,
    ]);

    component.applySelectedFilters(component.sideDetails[0], {
      status: "active",
    } as any);

    expect(component.filteredMapEntities.map((entity) => entity)).toEqual([
      c1,
      other,
    ]);
  }));

  it("should display map if location properties are available", fakeAsync(() => {
    // Clean-up child schema before running test
    Child.schema.forEach((schema, name) => {
      if (schema.dataType === "location") {
        Child.schema.delete(name);
      }
    });
    component.mapVisible = false;
    component.entity = new Child();
    component.leftSide = { entityType: Child };
    component.onMatch = testConfig.onMatch;

    fixture.detectChanges();
    tick();

    expect(component.mapVisible).toBeFalse();

    Child.schema.set("address", { dataType: "location" });

    component.ngOnInit();
    tick();

    expect(component.mapVisible).toBeTrue();

    Child.schema.delete("address");
  }));

  it("should not alter the config object", fakeAsync(() => {
    const config: MatchingEntitiesConfig = {
      columns: [
        ["name", "name"],
        ["projectNumber", "distance"],
      ],
      rightSide: { entityType: "School", columns: ["name", "distance"] },
      leftSide: { entityType: "Child", columns: ["name", "distance"] },
      onMatch: testConfig.onMatch,
    };
    Child.schema.set("address", { dataType: "location" });
    School.schema.set("address", { dataType: "location" });

    const configCopy = JSON.parse(JSON.stringify(config));
    routeData.next({ config: configCopy });

    fixture.detectChanges();
    tick();

    expect(configCopy).toEqual(config);

    Child.schema.delete("address");
    School.schema.delete("address");
  }));

  it("should infer multiSelect mode from onMatch's entity schema", fakeAsync(() => {
    Object.assign(component, testConfig);
    component.onMatch = {
      newEntityType: ChildSchoolRelation.ENTITY_TYPE,
      newEntityMatchPropertyLeft: "childId",
      newEntityMatchPropertyRight: "schoolId",
    };
    component.ngOnInit();
    tick();

    expect(component.sideDetails[0].multiSelect).toBeFalse();
    expect(component.sideDetails[1].multiSelect).toBeFalse();

    component.onMatch = {
      newEntityType: Note.ENTITY_TYPE,
      newEntityMatchPropertyLeft: "children",
      newEntityMatchPropertyRight: "schools",
    };
    component.ngOnInit();
    tick();

    expect(component.sideDetails[0].multiSelect).toBeTrue();
    expect(component.sideDetails[1].multiSelect).toBeTrue();
  }));
});

function expectConfigToMatch(
  component: MatchingEntitiesComponent,
  configToLoad: MatchingEntitiesConfig,
) {
  expect(component.columns).toEqual(configToLoad.columns);
  expect(component.onMatch).toEqual(configToLoad.onMatch);
  expect(component.matchActionLabel).toEqual(configToLoad.matchActionLabel);
  expect(component.rightSide.entityType).toEqual(
    configToLoad.rightSide.entityType,
  );
  expect(component.leftSide.entityType).toEqual(
    configToLoad.leftSide.entityType,
  );
}
