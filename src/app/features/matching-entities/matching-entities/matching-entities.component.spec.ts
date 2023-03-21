import { ComponentFixture, TestBed } from "@angular/core/testing";

import { MatchingEntitiesComponent } from "./matching-entities.component";
import { MatchingEntitiesConfig } from "./matching-entities-config";
import { Entity } from "../../../core/entity/model/entity";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { Child } from "../../../child-dev-project/children/model/child";
import { ChildSchoolRelation } from "../../../child-dev-project/children/model/childSchoolRelation";
import { ActivatedRoute } from "@angular/router";
import { FormDialogService } from "../../../core/form-dialog/form-dialog.service";
import { ConfigService } from "../../../core/config/config.service";
import { BehaviorSubject, of } from "rxjs";
import { FormFieldConfig } from "../../../core/entity-components/entity-form/entity-form/FormConfig";
import { Coordinates } from "../../location/coordinates";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { School } from "../../../child-dev-project/schools/model/school";

describe("MatchingEntitiesComponent", () => {
  let component: MatchingEntitiesComponent;
  let fixture: ComponentFixture<MatchingEntitiesComponent>;

  let mockActivatedRoute;

  let testConfig: MatchingEntitiesConfig = {
    columns: [],
    onMatch: {
      newEntityMatchPropertyLeft: "",
      newEntityMatchPropertyRight: "",
      newEntityType: "",
    },
    matchActionLabel: "match test",
    rightSide: { entityType: "Child" },
    leftSide: { entityType: "School" },
  };

  beforeEach(async () => {
    mockActivatedRoute = { data: of({ columns: [] }) };

    await TestBed.configureTestingModule({
      imports: [MatchingEntitiesComponent, MockedTestingModule.withState()],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: FormDialogService, useValue: null },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MatchingEntitiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create and map dynamic config to inputs", () => {
    component.entity = new Entity();
    component.config = testConfig;
    component.ngOnInit();

    expectConfigToMatch(component, testConfig);
  });

  it("should create and map config from active route as alternative to dynamic config", async () => {
    mockActivatedRoute.data = of({
      entity: new Entity(),
      config: testConfig,
    });
    await component.ngOnInit();

    expectConfigToMatch(component, testConfig);
  });

  it("should use central default config and overwrite with dynamic config of the component", () => {
    testConfig.columns = [["defaultA", "defaultB"]];
    const configService = TestBed.inject(ConfigService);
    spyOn(configService, "getConfig").and.returnValue(testConfig);
    const currentConfig: MatchingEntitiesConfig = {
      columns: [["newA", "newB"]],
    };
    component.entity = new Entity();
    component.config = {};
    component.ngOnInit();

    expectConfigToMatch(component, testConfig);

    component.entity = new Entity();
    component.config = currentConfig;
    component.ngOnInit();

    const expectedCombinedConfig = Object.assign({}, testConfig, currentConfig);
    expectConfigToMatch(component, expectedCombinedConfig);
  });

  it("should assign config entity to the selected entity of the side not having a table with select options", async () => {
    const testConfig: MatchingEntitiesConfig = {
      columns: [],
      onMatch: {
        newEntityMatchPropertyLeft: "",
        newEntityMatchPropertyRight: "",
        newEntityType: "",
      },
    };
    const testEntity = new Entity("1");
    component.entity = testEntity;

    component.config = Object.assign(
      { rightSide: { entityType: "Child" } } as MatchingEntitiesConfig,
      testConfig
    );
    await component.ngOnInit();

    expect(component.sideDetails[0].selected).toEqual(testEntity);

    component.config = Object.assign(
      {
        leftSide: { entityType: "Child" },
        rightSide: {},
      } as MatchingEntitiesConfig,
      testConfig
    );
    await component.ngOnInit();

    expect(component.sideDetails[1].selected).toEqual(testEntity);
  });

  it("should init details for template including available entities table and its columns", async () => {
    const testEntity = new Entity();
    component.entity = testEntity;
    component.config = {
      rightSide: { entityType: "Child" },
      columns: [
        ["_id", "name"],
        ["_rev", "phone"],
      ],
    };
    const allChildren: Child[] = [Child.create("1"), Child.create("2")];
    const loadTypeSpy = spyOn(TestBed.inject(EntityMapperService), "loadType");
    loadTypeSpy.and.resolveTo(allChildren);

    await component.ngOnInit();

    expect(component.sideDetails.length).toBe(2);

    expect(component.sideDetails[0].selected).toEqual(testEntity);
    expect(component.sideDetails[0].entityType).toEqual(
      testEntity.getConstructor()
    );
    expect(component.sideDetails[0].availableEntities).toBeUndefined();
    expect(component.sideDetails[0].columns).toEqual(["_id", "_rev"]);

    expect(component.sideDetails[1].selected).toBeUndefined();
    expect(component.sideDetails[1].entityType).toEqual(Child);
    expect(loadTypeSpy).toHaveBeenCalledWith(Child);
    expect(component.sideDetails[1].availableEntities).toEqual(allChildren);
    expect(component.sideDetails[1].columns).toEqual(["name", "phone"]);
  });

  it("should save a new entity to represent a confirmed matching", async () => {
    const testEntity = new Entity();
    const matchedEntity = Child.create("matched child");
    component.entity = testEntity;
    component.config = {
      onMatch: {
        newEntityType: ChildSchoolRelation.ENTITY_TYPE,
        newEntityMatchPropertyRight: "childId",
        newEntityMatchPropertyLeft: "schoolId",
      },
      columns: [["_id", "name"]],
    };
    const saveSpy = spyOn(TestBed.inject(EntityMapperService), "save");

    await component.ngOnInit();
    component.sideDetails[0].selectMatch(testEntity);
    component.sideDetails[1].selectMatch(matchedEntity);
    await component.createMatch();

    expect(saveSpy).toHaveBeenCalledWith(
      jasmine.objectContaining({
        schoolId: testEntity.getId(false),
        childId: matchedEntity.getId(false),
        name:
          "ChildSchoolRelation " + testEntity.toString() + " - matched child",
      } as Partial<ChildSchoolRelation>)
    );
    expect(saveSpy).toHaveBeenCalledWith(jasmine.any(ChildSchoolRelation));
  });

  it("should create distance column and publish updates", async () => {
    Child.schema.set("address", { dataType: "location" });
    component.entity = new Child();
    component.config = {
      columns: [[undefined, "distance"]],
      leftSide: { entityType: Child },
    };

    await component.ngOnInit();
    fixture.detectChanges();

    const distanceColumn = component.columns[0][1] as FormFieldConfig;
    expect(distanceColumn).toEqual({
      id: "distance",
      label: "Distance",
      view: "DisplayDistance",
      additional: {
        coordinatesProperties: ["address"],
        compareCoordinates: jasmine.any(BehaviorSubject),
      },
    });

    let newCoordinates: Coordinates[];
    distanceColumn.additional.compareCoordinates.subscribe(
      (res) => (newCoordinates = res)
    );

    const compare = new Child();
    compare["address"] = { lat: 52, lon: 13 };

    component.sideDetails[0].selectMatch(compare);

    expect(newCoordinates).toEqual([compare["address"]]);

    Child.schema.delete("address");
  });

  it("should select a entity if it has been selected in the map", async () => {
    component.entity = new Entity();
    component.rightSide = { entityType: Child };
    await component.ngOnInit();

    const child = new Child();
    component.entityInMapClicked(child);

    expect(component.sideDetails[1].selected).toBe(child);
  });

  it("should not change the provided config object directly", async () => {
    component.entity = new Entity();
    component.config = testConfig;
    await component.ngOnInit();
    const selectedChild = new Child();
    component.sideDetails[1].selectMatch(selectedChild);
    expect(component.sideDetails[1].selected).toEqual(selectedChild);

    const newFixture = TestBed.createComponent(MatchingEntitiesComponent);
    const newComponent = newFixture.componentInstance;
    component.entity = new Entity();
    component.config = testConfig;
    await newComponent.ngOnInit();

    expect(newComponent.sideDetails[1].selected).not.toEqual(selectedChild);
  });

  it("should update the distance calculation when the selected map properties change", async () => {
    Child.schema.set("address", { dataType: "location" });
    Child.schema.set("otherAddress", { dataType: "location" });
    Entity.schema.set("address", { dataType: "location" });
    const leftEntity = new Child();
    leftEntity["address"] = { lat: 52, lon: 14 };
    leftEntity["otherAddress"] = { lat: 53, lon: 14 };
    const rightEntity1 = new Entity();
    rightEntity1["address"] = { lat: 52, lon: 13 };
    const rightEntity2 = new Entity();
    rightEntity2["address"] = { lat: 53, lon: 13 };
    spyOn(TestBed.inject(EntityMapperService), "loadType").and.resolveTo([
      rightEntity1,
      rightEntity2,
    ]);
    component.entity = new Entity();
    component.config = {
      columns: [],
      leftSide: {
        columns: ["distance"],
      },
      rightSide: {
        columns: ["distance"],
        entityType: "Child",
      },
    };
    await component.ngOnInit();
    fixture.detectChanges();
    const leftSide = component.sideDetails[0];
    const rightSide = component.sideDetails[1];
    let lastLeftValue: Coordinates[];
    let lastRightValue: Coordinates[];
    leftSide.distanceColumn.compareCoordinates.subscribe(
      (res) => (lastLeftValue = res)
    );
    rightSide.distanceColumn.compareCoordinates.subscribe(
      (res) => (lastRightValue = res)
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
    Entity.schema.delete("address");
  });

  it("should only display filtered entities in the map", async () => {
    const c1 = new Child();
    c1.status = "active";
    const c2 = new Child();
    c2.status = "inactive";
    c2.dropoutDate = new Date();
    const c3 = new Child();
    c3.status = "inactive";
    const other = new ChildSchoolRelation();
    await TestBed.inject(EntityMapperService).saveAll([c1, c2, c3, other]);
    component.leftSide = {
      entityType: Child,
      prefilter: { dropoutDate: { $exists: false } } as any,
      columns: ["status"],
    };
    component.rightSide = {
      entityType: ChildSchoolRelation,
      columns: ["_id"],
    };
    await component.ngOnInit();

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
  });

  it("should display map if location properties are available", async () => {
    // Clean-up child schema before running test
    Child.schema.forEach((schema, name) => {
      if (schema.dataType === "location") {
        Child.schema.delete(name);
      }
    });
    component.leftSide = { entityType: Child };
    component.entity = new Child();

    await component.ngOnInit();

    expect(component.mapVisible).toBeFalse();

    Child.schema.set("address", { dataType: "location" });

    await component.ngOnInit();

    expect(component.mapVisible).toBeTrue();

    Child.schema.delete("address");
  });

  it("should not alter the config object", async () => {
    const config: MatchingEntitiesConfig = {
      columns: [
        ["name", "name"],
        ["projectNumber", "distance"],
      ],
      rightSide: { entityType: "School", columns: ["name", "distance"] },
      leftSide: { entityType: "Child", columns: ["name", "distance"] },
    };
    Child.schema.set("address", { dataType: "location" });
    School.schema.set("address", { dataType: "location" });

    const configCopy = JSON.parse(JSON.stringify(config));
    mockActivatedRoute.data = of({ config: configCopy });

    await component.ngOnInit();

    expect(configCopy).toEqual(config);

    Child.schema.delete("address");
    School.schema.delete("address");
  });
});

function expectConfigToMatch(
  component: MatchingEntitiesComponent,
  configToLoad: MatchingEntitiesConfig
) {
  expect(component.columns).toEqual(configToLoad.columns);
  expect(component.onMatch).toEqual(configToLoad.onMatch);
  expect(component.matchActionLabel).toEqual(configToLoad.matchActionLabel);
  expect(component.rightSide.entityType).toEqual(
    configToLoad.rightSide.entityType
  );
  expect(component.leftSide.entityType).toEqual(
    configToLoad.leftSide.entityType
  );
}
