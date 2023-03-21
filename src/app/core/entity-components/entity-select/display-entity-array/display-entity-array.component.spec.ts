import { ComponentFixture, TestBed } from "@angular/core/testing";

import { DisplayEntityArrayComponent } from "./display-entity-array.component";
import { EntityMapperService } from "../../../entity/entity-mapper.service";
import { Child } from "../../../../child-dev-project/children/model/child";
import { Note } from "../../../../child-dev-project/notes/model/note";
import {
  DatabaseEntity,
  EntityRegistry,
  entityRegistry,
} from "../../../entity/database-entity.decorator";
import { Entity } from "app/core/entity/model/entity";
import { mockEntityMapper } from "../../../entity/mock-entity-mapper-service";
import { School } from "../../../../child-dev-project/schools/model/school";
import { DatabaseField } from "../../../entity/database-field.decorator";

describe("DisplayEntityArrayComponent", () => {
  let component: DisplayEntityArrayComponent;
  let fixture: ComponentFixture<DisplayEntityArrayComponent>;

  let testEntities: Entity[];

  beforeEach(async () => {
    testEntities = [new Child(), new Child(), new School()];
    await TestBed.configureTestingModule({
      imports: [DisplayEntityArrayComponent],
      providers: [
        {
          provide: EntityMapperService,
          useValue: mockEntityMapper(testEntities),
        },
        { provide: EntityRegistry, useValue: entityRegistry },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DisplayEntityArrayComponent);
    component = fixture.componentInstance;
    component.entity = new Note();
    component.id = "children";
    component.value = [];
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should load entities for single type", async () => {
    const expectedEntities = [testEntities[0]];

    @DatabaseEntity("DisplayEntityTest1")
    class DisplayEntityTest1 extends Entity {
      @DatabaseField({
        dataType: "entity-array",
        additional: Child.ENTITY_TYPE,
      })
      relatedEntities;
    }

    const testEntity = new DisplayEntityTest1();
    testEntity.relatedEntities = expectedEntities.map((e) => e.getId(false));

    component.entity = testEntity;
    component.id = "relatedEntities";
    component.value = testEntity.relatedEntities;
    await component.ngOnInit();

    expect(component.entities).toEqual(expectedEntities);
  });

  it("should load entities for mixed types", async () => {
    const expectedEntities = [testEntities[0], testEntities[2]];

    @DatabaseEntity("DisplayEntityTest2")
    class DisplayEntityTest2 extends Entity {
      @DatabaseField({
        dataType: "entity-array",
        additional: [Child.ENTITY_TYPE, School.ENTITY_TYPE],
      })
      relatedEntities;
    }

    const testEntity = new DisplayEntityTest2();
    testEntity.relatedEntities = expectedEntities.map((e) => e.getId(true));

    component.entity = testEntity;
    component.id = "relatedEntities";
    component.value = testEntity.relatedEntities;
    await component.ngOnInit();

    expect(component.entities).toEqual(expectedEntities);
  });
});
