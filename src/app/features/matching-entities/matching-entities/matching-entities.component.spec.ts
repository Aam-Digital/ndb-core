import { ComponentFixture, TestBed } from "@angular/core/testing";

import { MatchingEntitiesComponent } from "./matching-entities.component";
import { MatchingEntitiesConfig } from "./matching-entities-config";
import { Entity } from "../../../core/entity/model/entity";
import { MatchingEntitiesModule } from "../matching-entities.module";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { Child } from "../../../child-dev-project/children/model/child";
import { ChildSchoolRelation } from "../../../child-dev-project/children/model/childSchoolRelation";
import { ActivatedRoute } from "@angular/router";

describe("MatchingEntitiesComponent", () => {
  let component: MatchingEntitiesComponent;
  let fixture: ComponentFixture<MatchingEntitiesComponent>;

  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;

  beforeEach(async () => {
    mockEntityMapper = jasmine.createSpyObj(["loadType", "save"]);

    await TestBed.configureTestingModule({
      declarations: [MatchingEntitiesComponent],
      imports: [MatchingEntitiesModule],
      providers: [
        { provide: EntityMapperService, useValue: mockEntityMapper },
        { provide: ActivatedRoute, useValue: { data: null } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MatchingEntitiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create and map dynamic config to inputs", () => {
    const testConfig: MatchingEntitiesConfig = {
      columns: [],
      onMatch: {
        newEntityMatchPropertyLeft: "",
        newEntityMatchPropertyRight: "",
        newEntityType: "",
      },
      showMap: true,
      matchActionLabel: "match test",
      rightEntityType: "Child",
      leftEntityType: "School",
    };

    component.onInitFromDynamicConfig({
      entity: new Entity(),
      config: testConfig,
    });

    expect(component).toBeTruthy();
    expect(component.columns).toEqual(testConfig.columns);
    expect(component.onMatch).toEqual(testConfig.onMatch);
    expect(component.showMap).toEqual(testConfig.showMap);
    expect(component.matchActionLabel).toEqual(testConfig.matchActionLabel);
    expect(component.rightEntityType).toEqual(testConfig.rightEntityType);
    expect(component.leftEntityType).toEqual(testConfig.leftEntityType);
  });

  it("should assign config entity to the selected entity of the side not having a table with select options", () => {
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
      config: Object.assign({ rightEntityType: "Child" }, testConfig),
    });

    expect(component.leftEntitySelected).toEqual(testEntity);

    component.onInitFromDynamicConfig({
      entity: testEntity,
      config: Object.assign({ leftEntityType: "Child" }, testConfig),
    });

    expect(component.rightEntitySelected).toEqual(testEntity);
  });

  it("should init details for template including available entities table and its columns", async () => {
    const testEntity = new Entity();
    component.leftEntitySelected = testEntity;
    component.rightEntityType = "Child";
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
    component.leftEntitySelected = testEntity;
    component.rightEntitySelected = matchedEntity;
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
  });
});
