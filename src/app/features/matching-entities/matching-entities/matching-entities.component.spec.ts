import { ComponentFixture, TestBed } from "@angular/core/testing";

import { MatchingEntitiesComponent } from "./matching-entities.component";
import { MatchingEntitiesConfig } from "./matching-entities-config";
import { Entity } from "../../../core/entity/model/entity";
import { MatchingEntitiesModule } from "../matching-entities.module";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { Child } from "../../../child-dev-project/children/model/child";
import { ChildSchoolRelation } from "../../../child-dev-project/children/model/childSchoolRelation";
import { ActivatedRoute } from "@angular/router";
import { FormDialogService } from "../../../core/form-dialog/form-dialog.service";
import { EntitySchemaService } from "../../../core/entity/schema/entity-schema.service";
import { ConfigService } from "../../../core/config/config.service";
import { of, ReplaySubject } from "rxjs";
import { FormFieldConfig } from "../../../core/entity-components/entity-form/entity-form/FormConfig";
import { Coordinates } from "../../location/coordinates";

describe("MatchingEntitiesComponent", () => {
  let component: MatchingEntitiesComponent;
  let fixture: ComponentFixture<MatchingEntitiesComponent>;

  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;
  let mockActivatedRoute;
  let mockConfigService: jasmine.SpyObj<ConfigService>;

  let testConfig: MatchingEntitiesConfig = {
    columns: [],
    onMatch: {
      newEntityMatchPropertyLeft: "",
      newEntityMatchPropertyRight: "",
      newEntityType: "",
    },
    showMap: ["address", "address"],
    matchActionLabel: "match test",
    rightSide: { entityType: "Child" },
    leftSide: { entityType: "School" },
  };

  beforeEach(async () => {
    mockEntityMapper = jasmine.createSpyObj(["loadType", "save"]);
    mockEntityMapper.loadType.and.resolveTo([]);
    mockActivatedRoute = { data: null };
    mockConfigService = jasmine.createSpyObj(["getConfig"]);

    await TestBed.configureTestingModule({
      imports: [MatchingEntitiesModule],
      providers: [
        { provide: EntityMapperService, useValue: mockEntityMapper },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: FormDialogService, useValue: null },
        EntitySchemaService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MatchingEntitiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create and map dynamic config to inputs", () => {
    component.onInitFromDynamicConfig({
      entity: new Entity(),
      config: testConfig,
    });

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
    mockConfigService.getConfig.and.returnValue(testConfig);
    const currentConfig: MatchingEntitiesConfig = {
      columns: [
        ["newA", "newB"],
      ],
    }

    component.onInitFromDynamicConfig({
      entity: new Entity(),
      config: {},
    });
    expectConfigToMatch(component, testConfig);

    component.onInitFromDynamicConfig({
      entity: new Entity(),
      config: currentConfig,
    });
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
    const testEntity = new Entity();

    component.onInitFromDynamicConfig({
      entity: testEntity,
      config: Object.assign(
        { rightSide: { entityType: "Child" } } as MatchingEntitiesConfig,
        testConfig
      ),
    });
    await component.ngOnInit();

    expect(component.sideDetails[0].selected).toEqual(testEntity);

    component.onInitFromDynamicConfig({
      entity: testEntity,
      config: Object.assign(
        {
          leftSide: { entityType: "Child" },
          rightSide: {},
        } as MatchingEntitiesConfig,
        testConfig
      ),
    });
    await component.ngOnInit();

    expect(component.sideDetails[1].selected).toEqual(testEntity);
  });

  it("should init details for template including available entities table and its columns", async () => {
    const testEntity = new Entity();
    component.leftSide = { selected: testEntity };
    component.rightSide = { entityType: "Child" };
    component.columns = [
      ["_id", "name"],
      ["_rev", "phone"],
    ];
    const allChildren: Child[] = [Child.create("1"), Child.create("2")];
    mockEntityMapper.loadType.and.resolveTo(allChildren);

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
    expect(mockEntityMapper.loadType).toHaveBeenCalledWith(Child);
    expect(component.sideDetails[1].availableEntities).toEqual(allChildren);
    expect(component.sideDetails[1].columns).toEqual(["name", "phone"]);
  });

  it("should save a new entity to represent a confirmed matching", async () => {
    component.onMatch = {
      newEntityType: ChildSchoolRelation.ENTITY_TYPE,
      newEntityMatchPropertyRight: "childId",
      newEntityMatchPropertyLeft: "schoolId",
    };
    const testEntity = new Entity();
    const matchedEntity = Child.create("matched child");
    component.leftSide = { selected: testEntity };
    component.rightSide = { selected: matchedEntity };
    component.columns = [["_id", "name"]];

    await component.ngOnInit();
    await component.createMatch();

    expect(mockEntityMapper.save).toHaveBeenCalledWith(
      jasmine.objectContaining({
        schoolId: testEntity.getId(false),
        childId: matchedEntity.getId(false),
        name:
          "ChildSchoolRelation " + testEntity.toString() + " - matched child",
      } as Partial<ChildSchoolRelation>)
    );
    expect(mockEntityMapper.save).toHaveBeenCalledWith(
      jasmine.any(ChildSchoolRelation)
    );
  });

  it("should create distance column and publish updates", async () => {
    component.columns = [[undefined, "distance"]];
    component.showMap = ["address", "address"];
    component.entity = new Child();
    component.leftSide = { entityType: Child };

    await component.ngOnInit();

    const distanceColumn = component.columns[0][1] as FormFieldConfig;
    expect(distanceColumn).toEqual({
      id: "distance",
      label: "Distance",
      view: "DisplayDistance",
      additional: {
        coordinatesProperty: "address",
        compareCoordinates: jasmine.any(ReplaySubject),
      },
    });

    let newCoordinates: Coordinates;
    distanceColumn.additional.compareCoordinates.subscribe(
      (res) => (newCoordinates = res)
    );

    const compare = new Child();
    compare["address"] = { lat: 52, lon: 13 };
    component.sideDetails[0].selectMatch(compare);
    expect(newCoordinates).toEqual(compare["address"]);
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

    component.onInitFromDynamicConfig({
      entity: new Entity(),
      config: testConfig,
    });
    await component.ngOnInit();
    const selectedChild = new Child();
    component.sideDetails[1].selectMatch(selectedChild);
    expect(component.sideDetails[1].selected).toEqual(selectedChild);

    const newFixture = TestBed.createComponent(MatchingEntitiesComponent);
    const newComponent = newFixture.componentInstance;
    newComponent.onInitFromDynamicConfig({
      entity: new Entity(),
      config: testConfig,
    });
    await newComponent.ngOnInit();

    expect(newComponent.sideDetails[1].selected).not.toEqual(selectedChild);
  });
});

function expectConfigToMatch(component: MatchingEntitiesComponent, configToLoad: MatchingEntitiesConfig) {
  expect(component.columns).toEqual(configToLoad.columns);
  expect(component.onMatch).toEqual(configToLoad.onMatch);
  expect(component.showMap).toEqual(configToLoad.showMap);
  expect(component.matchActionLabel).toEqual(configToLoad.matchActionLabel);
  expect(component.rightSide.entityType).toEqual(
    configToLoad.rightSide.entityType
  );
  expect(component.leftSide.entityType).toEqual(
    configToLoad.leftSide.entityType
  );
}
