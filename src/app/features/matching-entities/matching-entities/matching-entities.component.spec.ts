import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { MatchingEntitiesComponent } from "./matching-entities.component";
import { MatchingEntitiesConfig } from "./matching-entities-config";
import { Entity } from "../../../core/entity/model/entity";
import { EntityMapperService } from "../../../core/entity/entity-mapper/entity-mapper.service";
import { ChildSchoolRelation } from "../../../child-dev-project/children/model/childSchoolRelation";
import { ActivatedRoute } from "@angular/router";
import { FormDialogService } from "../../../core/form-dialog/form-dialog.service";
import { ConfigService } from "../../../core/config/config.service";
import { BehaviorSubject, NEVER, Subject } from "rxjs";
import { FormFieldConfig } from "../../../core/common-components/entity-form/FormConfig";
import { Coordinates } from "../../location/coordinates";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { DynamicComponentConfig } from "../../../core/config/dynamic-components/dynamic-component-config.interface";
import { Note } from "../../../child-dev-project/notes/model/note";
import { GeoLocation } from "app/features/location/geo-location";
import { TestEntity } from "../../../utils/test-utils/TestEntity";
import {
  DatabaseEntity,
  EntityRegistry,
} from "../../../core/entity/database-entity.decorator";

describe("MatchingEntitiesComponent", () => {
  let component: MatchingEntitiesComponent;
  let fixture: ComponentFixture<MatchingEntitiesComponent>;

  let routeData: Subject<DynamicComponentConfig<MatchingEntitiesConfig>>;
  let mockConfigService: any;
  let entityRegistry: EntityRegistry;

  let testConfig: MatchingEntitiesConfig = {
    columns: [],
    onMatch: {
      newEntityMatchPropertyLeft: "schoolId",
      newEntityMatchPropertyRight: "childId",
      newEntityType: ChildSchoolRelation.ENTITY_TYPE,
    },
    matchActionLabel: "match test",
    rightSide: { entityType: TestEntity.ENTITY_TYPE },
    leftSide: { entityType: TestEntity.ENTITY_TYPE },
  };

  const LOCATION_1: GeoLocation = {
    geoLookup: { lat: 52, lon: 13, display_name: "loc 1" },
  };
  const LOCATION_2: GeoLocation = {
    geoLookup: { lat: 52, lon: 14, display_name: "loc 1" },
  };

  beforeEach(waitForAsync(() => {
    routeData = new Subject();
    mockConfigService = {
      getConfig: vi.fn(),
      configUpdates: NEVER,
    };
    entityRegistry = new EntityRegistry();
    entityRegistry.add(TestEntity.ENTITY_TYPE, TestEntity);
    entityRegistry.add(ChildSchoolRelation.ENTITY_TYPE, ChildSchoolRelation);
    entityRegistry.add(Entity.ENTITY_TYPE, Entity);
    entityRegistry.add(Note.ENTITY_TYPE, Note);
    entityRegistry.add(OtherEntity.ENTITY_TYPE, OtherEntity);

    TestBed.configureTestingModule({
      imports: [MatchingEntitiesComponent, MockedTestingModule.withState()],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            data: routeData,
            snapshot: {
              queryParams: {},
              queryParamMap: { get: () => null },
            },
          },
        },
        { provide: FormDialogService, useValue: null },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: EntityRegistry, useValue: entityRegistry },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MatchingEntitiesComponent);
    component = fixture.componentInstance;
  }));

  async function stabilizeCurrentFixture() {
    fixture.detectChanges();
    await fixture.whenStable();
    await Promise.resolve();
    fixture.detectChanges();
  }

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
    mockConfigService.getConfig.mockReturnValue(testConfig);

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

  it("should assign config entity to the selected entity of the side not having a table with select options", async () => {
    const testEntity = new TestEntity("1");
    component.entity = testEntity;
    component.rightSide = { entityType: TestEntity.ENTITY_TYPE };
    component.onMatch = testConfig.onMatch;
    await stabilizeCurrentFixture();

    expect(component.sideDetails[0].selected).toEqual([testEntity]);

    component.leftSide = { entityType: TestEntity.ENTITY_TYPE };
    component.rightSide = {};
    await component.ngOnInit();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.sideDetails[1].selected).toEqual([testEntity]);
  });

  it("should init details for template including available entities table and its columns", async () => {
    const testEntity = new TestEntity();
    component.entity = testEntity;
    component.rightSide = { entityType: TestEntity.ENTITY_TYPE };
    component.onMatch = testConfig.onMatch;
    component.columns = [
      ["_id", "name"],
      ["_rev", "phone"],
    ];
    const allChildren: TestEntity[] = [
      TestEntity.create("1"),
      TestEntity.create("2"),
    ];
    const loadTypeSpy = vi.spyOn(
      TestBed.inject(EntityMapperService),
      "loadType",
    );
    loadTypeSpy.mockResolvedValue(allChildren);

    await stabilizeCurrentFixture();

    expect(component.sideDetails.length).toBe(2);

    expect(component.sideDetails[0].selected).toEqual([testEntity]);
    expect(component.sideDetails[0].entityType).toEqual(testEntity.getType());
    expect(component.sideDetails[0].availableEntities).toBeUndefined();
    expect(component.sideDetails[0].columns).toEqual(["_id", "_rev"]);

    expect(component.sideDetails[1].selected).toBeUndefined();
    expect(component.sideDetails[1].entityType).toEqual(TestEntity.ENTITY_TYPE);
    expect(loadTypeSpy).toHaveBeenCalledWith(TestEntity.ENTITY_TYPE);
    expect(component.sideDetails[1].availableEntities).toEqual(allChildren);
    expect(component.sideDetails[1].columns).toEqual(["name", "phone"]);
  });

  it("should select only one entity at a time in single select mode", async () => {
    const matchedEntity = TestEntity.create("matched child");
    const otherMatchedEntity = TestEntity.create("second matched child");

    Object.assign(component, testConfig);
    component.onMatch = {
      newEntityType: ChildSchoolRelation.ENTITY_TYPE,
      newEntityMatchPropertyRight: "childId",
      newEntityMatchPropertyLeft: "schoolId",
    };
    await stabilizeCurrentFixture();
    const testedSide = component.sideDetails[1];

    testedSide.selectMatch(matchedEntity);
    expect(testedSide.selected).toEqual([matchedEntity]);

    testedSide.selectMatch(otherMatchedEntity);
    expect(testedSide.selected).toEqual([otherMatchedEntity]);
  });

  it("should select multiple entities in multiSelect mode", async () => {
    const matchedEntity = TestEntity.create("matched child");
    const otherMatchedEntity = TestEntity.create("second matched child");

    Object.assign(component, testConfig);
    component.onMatch = {
      newEntityType: Note.ENTITY_TYPE,
      newEntityMatchPropertyRight: "children",
      newEntityMatchPropertyLeft: "schools",
    };
    await stabilizeCurrentFixture();
    const testedSide = component.sideDetails[1];

    testedSide.selectMatch(matchedEntity);
    testedSide.selectMatch(otherMatchedEntity);
    expect(testedSide.selected).toEqual([matchedEntity, otherMatchedEntity]);

    testedSide.selectMatch(matchedEntity); // deselect by second click
    expect(testedSide.selected).toEqual([otherMatchedEntity]);
  });

  it("should create a new entity onMatch, with single entity property", async () => {
    const testEntity = new TestEntity();
    const matchedEntity = TestEntity.create("matched child");
    component.entity = testEntity;
    Object.assign(component, testConfig);
    component.onMatch = {
      newEntityType: ChildSchoolRelation.ENTITY_TYPE,
      newEntityMatchPropertyRight: "childId",
      newEntityMatchPropertyLeft: "schoolId",
    };
    component.columns = [["_id", "name"]];
    const saveSpy = vi.spyOn(TestBed.inject(EntityMapperService), "save");

    await stabilizeCurrentFixture();
    component.sideDetails[0].selected = [testEntity];
    component.sideDetails[1].selected = [matchedEntity];

    await component.createMatch();
    await fixture.whenStable();

    expect(saveSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        schoolId: testEntity.getId(),
        childId: matchedEntity.getId(),
        name:
          ChildSchoolRelation.label +
          " " +
          testEntity.toString() +
          " - matched child",
      } as Partial<ChildSchoolRelation>),
    );
    expect(saveSpy).toHaveBeenCalledWith(expect.any(ChildSchoolRelation));
  });

  it("should create a new entity onMatch, with multiSelect entity-array property", async () => {
    const testEntity = new Entity();
    const child1 = TestEntity.create("matched child 1");
    const child2 = TestEntity.create("matched child 2");

    Object.assign(component, testConfig);
    component.onMatch = {
      newEntityType: Note.ENTITY_TYPE,
      newEntityMatchPropertyRight: "children",
      newEntityMatchPropertyLeft: "schools",
    };
    component.entity = testEntity;
    component.columns = [["_id", "name"]];
    const saveSpy = vi.spyOn(TestBed.inject(EntityMapperService), "save");
    await stabilizeCurrentFixture();

    component.sideDetails[0].selected = [testEntity];
    component.sideDetails[1].selected = [child1, child2];

    await component.createMatch();
    await fixture.whenStable();

    expect(saveSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        schools: [testEntity.getId()],
        children: [child1.getId(), child2.getId()],
        name:
          "Note " +
          testEntity.toString() +
          " - matched child 1, matched child 2",
      } as Partial<ChildSchoolRelation>),
    );
    expect(saveSpy).toHaveBeenCalledWith(expect.any(Note));
  });

  it("should create distance column and publish updates", async () => {
    TestEntity.schema.set("address", { dataType: "location" });
    component.entity = new TestEntity();
    component.columns = [[undefined, "distance"]];
    component.leftSide = { entityType: TestEntity.ENTITY_TYPE };
    component.onMatch = testConfig.onMatch;

    await stabilizeCurrentFixture();

    const distanceColumn = component.columns[0][1] as FormFieldConfig;
    expect(distanceColumn).toEqual({
      id: "distance",
      label: "Distance",
      viewComponent: "DisplayDistance",
      dataType: "number",
      additional: {
        coordinatesProperties: ["address"],
        compareCoordinates: expect.any(BehaviorSubject),
      },
    });

    let newCoordinates: Coordinates[];
    distanceColumn.additional.compareCoordinates.subscribe(
      (res) => (newCoordinates = res),
    );

    const compare = new TestEntity();
    compare["address"] = LOCATION_1;

    component.sideDetails[0].selectMatch(compare);

    expect(newCoordinates).toEqual([
      (compare["address"] as GeoLocation)?.geoLookup,
    ]);

    TestEntity.schema.delete("address");
  });

  it("should select an entity if it has been selected in the map", async () => {
    component.entity = new Entity();
    component.rightSide = { entityType: TestEntity.ENTITY_TYPE };
    component.onMatch = testConfig.onMatch;
    await stabilizeCurrentFixture();

    const child = new TestEntity();
    component.entityInMapClicked(child);

    expect(component.sideDetails[1].selected).toEqual([child]);
  });

  it("should not change the provided config object directly", async () => {
    Object.assign(component, testConfig);
    await stabilizeCurrentFixture();
    const selectedChild = new TestEntity();
    component.sideDetails[1].selectMatch(selectedChild);
    expect(component.sideDetails[1].selected).toEqual([selectedChild]);

    const newFixture = TestBed.createComponent(MatchingEntitiesComponent);
    const newComponent = newFixture.componentInstance;
    newComponent.entity = new TestEntity();
    Object.assign(newComponent, testConfig);
    newFixture.detectChanges();
    await newFixture.whenStable();
    newFixture.detectChanges();

    expect(newComponent.sideDetails[1].selected).not.toEqual([selectedChild]);
  });

  it("should update the distance calculation when the selected map properties change", async () => {
    Object.assign(component, testConfig);
    TestEntity.schema.set("address", { dataType: "location" });
    TestEntity.schema.set("otherAddress", { dataType: "location" });
    const leftEntity = new TestEntity();
    leftEntity["address"] = LOCATION_1;
    leftEntity["otherAddress"] = LOCATION_2;
    const rightEntity1 = new TestEntity();
    rightEntity1["address"] = LOCATION_1;
    const rightEntity2 = new TestEntity();
    rightEntity2["address"] = LOCATION_2;
    vi.spyOn(TestBed.inject(EntityMapperService), "loadType").mockResolvedValue(
      [rightEntity1, rightEntity2],
    );
    component.entity = leftEntity;
    component.columns = [];
    component.leftSide = {
      columns: ["distance"],
    };
    component.rightSide = {
      columns: ["distance"],
      entityType: TestEntity.ENTITY_TYPE,
    };
    await stabilizeCurrentFixture();
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
      (leftEntity["address"] as GeoLocation)?.geoLookup,
      (leftEntity["otherAddress"] as GeoLocation)?.geoLookup,
    ]);

    // values should be emitted again
    lastLeftValue = undefined;
    lastRightValue = undefined;
    // select only one property
    component.displayedLocationProperties[TestEntity.ENTITY_TYPE] = ["address"];
    component.updateMarkersAndDistances();

    expect(lastLeftValue).toEqual([]);
    expect(lastRightValue).toEqual([
      (leftEntity["address"] as GeoLocation)?.geoLookup,
    ]);

    // select an entity for right
    rightSide.selectMatch(rightEntity1);

    expect(lastLeftValue).toEqual([
      (rightEntity1["address"] as GeoLocation)?.geoLookup,
    ]);
    expect(lastRightValue).toEqual([
      (leftEntity["address"] as GeoLocation)?.geoLookup,
    ]);

    lastLeftValue = undefined;
    lastRightValue = undefined;
    //select both properties
    component.displayedLocationProperties[TestEntity.ENTITY_TYPE] = [
      "address",
      "otherAddress",
    ];
    component.updateMarkersAndDistances();

    expect(lastLeftValue).toEqual([
      (rightEntity1["address"] as GeoLocation)?.geoLookup,
      (rightEntity1["otherAddress"] as GeoLocation)?.geoLookup,
    ]);
    expect(lastRightValue).toEqual([
      (leftEntity["address"] as GeoLocation)?.geoLookup,
      (leftEntity["otherAddress"] as GeoLocation)?.geoLookup,
    ]);

    TestEntity.schema.delete("otherAddress");
    TestEntity.schema.delete("address");
    TestEntity.schema.delete("address");
  });

  @DatabaseEntity("OtherEntity")
  class OtherEntity extends Entity {}

  it("should only display filtered entities in the map", async () => {
    const c1 = new TestEntity();
    c1.name = "active";
    const c2 = new TestEntity();
    c2.name = "inactive";
    c2.category = { id: "x", label: "inactive" };
    const c3 = new TestEntity();
    c3.name = "inactive";
    const other = new OtherEntity();
    await TestBed.inject(EntityMapperService).saveAll([c1, c2, c3, other]);

    component.leftSide = {
      entityType: TestEntity.ENTITY_TYPE,
      prefilter: { category: { $exists: false } } as any,
      columns: ["name"],
    };
    component.rightSide = {
      entityType: OtherEntity.ENTITY_TYPE,
      columns: ["_id"],
    };
    component.onMatch = testConfig.onMatch;
    await stabilizeCurrentFixture();

    expect(component.filteredMapEntities.map((entity) => entity)).toEqual([
      c1,
      c3,
      other,
    ]);

    component.applySelectedFilters(component.sideDetails[0], {
      name: "active",
    } as any);

    expect(component.filteredMapEntities.map((entity) => entity)).toEqual([
      c1,
      other,
    ]);
  });

  it("should display map if location properties are available", async () => {
    vi.useFakeTimers();
    try {
      // Clean-up child schema before running test
      TestEntity.schema.forEach((schema, name) => {
        if (schema.dataType === "location") {
          TestEntity.schema.delete(name);
        }
      });
      component.mapVisible = false;
      component.entity = new TestEntity();
      component.leftSide = { entityType: TestEntity.ENTITY_TYPE };
      component.onMatch = testConfig.onMatch;

      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(0);

      expect(component.mapVisible).toBe(false);

      TestEntity.schema.set("address", { dataType: "location" });

      component.ngOnInit();
      await vi.advanceTimersByTimeAsync(0);

      expect(component.mapVisible).toBe(true);

      TestEntity.schema.delete("address");
    } finally {
      vi.useRealTimers();
    }
  });

  it("should not alter the config object", async () => {
    vi.useFakeTimers();
    try {
      const config: MatchingEntitiesConfig = {
        columns: [
          ["name", "name"],
          ["projectNumber", "distance"],
        ],
        rightSide: {
          entityType: TestEntity.ENTITY_TYPE,
          columns: ["name", "distance"],
        },
        leftSide: {
          entityType: TestEntity.ENTITY_TYPE,
          columns: ["name", "distance"],
        },
        onMatch: testConfig.onMatch,
      };
      TestEntity.schema.set("address1", { dataType: "location" });
      TestEntity.schema.set("address2", { dataType: "location" });

      const configCopy = JSON.parse(JSON.stringify(config));
      routeData.next({ config: configCopy });

      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(0);

      expect(configCopy).toEqual(config);

      TestEntity.schema.delete("address1");
      TestEntity.schema.delete("address2");
    } finally {
      vi.useRealTimers();
    }
  });

  it("should infer multiSelect mode from onMatch's entity schema", async () => {
    vi.useFakeTimers();
    try {
      Object.assign(component, testConfig);
      component.onMatch = {
        newEntityType: ChildSchoolRelation.ENTITY_TYPE,
        newEntityMatchPropertyLeft: "childId",
        newEntityMatchPropertyRight: "schoolId",
      };
      component.ngOnInit();
      await vi.advanceTimersByTimeAsync(0);

      expect(component.sideDetails[0].multiSelect).toBeFalsy();
      expect(component.sideDetails[1].multiSelect).toBeFalsy();

      component.onMatch = {
        newEntityType: Note.ENTITY_TYPE,
        newEntityMatchPropertyLeft: "children",
        newEntityMatchPropertyRight: "schools",
      };
      component.ngOnInit();
      await vi.advanceTimersByTimeAsync(0);

      expect(component.sideDetails[0].multiSelect).toBe(true);
      expect(component.sideDetails[1].multiSelect).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
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
