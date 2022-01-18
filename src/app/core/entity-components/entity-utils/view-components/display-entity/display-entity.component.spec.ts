import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";

import { DisplayEntityComponent } from "./display-entity.component";
import { EntityMapperService } from "../../../../entity/entity-mapper.service";
import { Child } from "../../../../../child-dev-project/children/model/child";
import { ChildSchoolRelation } from "../../../../../child-dev-project/children/model/childSchoolRelation";
import { School } from "../../../../../child-dev-project/schools/model/school";
import { EntitySchemaService } from "../../../../entity/schema/entity-schema.service";
import { DynamicEntityService } from "../../../../entity/dynamic-entity.service";

describe("DisplayEntityComponent", () => {
  let component: DisplayEntityComponent;
  let fixture: ComponentFixture<DisplayEntityComponent>;
  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;

  beforeEach(async () => {
    mockEntityMapper = jasmine.createSpyObj(["load"]);
    mockEntityMapper.load.and.resolveTo(new Child());
    await TestBed.configureTestingModule({
      declarations: [DisplayEntityComponent],
      providers: [
        { provide: EntityMapperService, useValue: mockEntityMapper },
        EntitySchemaService,
        DynamicEntityService,
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DisplayEntityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should use the block component when available", fakeAsync(() => {
    const school = new School();
    mockEntityMapper.load.and.resolveTo(school);
    const relation = new ChildSchoolRelation();
    relation.schoolId = school.getId();

    component.onInitFromDynamicConfig({
      entity: relation,
      id: "schoolId",
    });
    tick();

    expect(component.entityBlockComponent).toEqual(School.getBlockComponent());
    expect(mockEntityMapper.load).toHaveBeenCalledWith(
      School,
      relation.schoolId
    );
    expect(component.entityToDisplay).toEqual(school);
  }));
});
