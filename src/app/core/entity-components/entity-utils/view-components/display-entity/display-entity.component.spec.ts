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
import {
  EntityRegistry,
  entityRegistry,
} from "../../../../entity/database-entity.decorator";
import { Router } from "@angular/router";

describe("DisplayEntityComponent", () => {
  let component: DisplayEntityComponent;
  let fixture: ComponentFixture<DisplayEntityComponent>;
  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    mockEntityMapper = jasmine.createSpyObj(["load"]);
    mockEntityMapper.load.and.resolveTo(new Child());
    mockRouter = jasmine.createSpyObj(["navigate"]);
    await TestBed.configureTestingModule({
      declarations: [DisplayEntityComponent],
      providers: [
        { provide: EntityMapperService, useValue: mockEntityMapper },
        {
          provide: EntityRegistry,
          useValue: entityRegistry,
        },
        { provide: Router, useValue: mockRouter },
        EntitySchemaService,
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

    component.onInitFromDynamicConfig({
      entity: new ChildSchoolRelation(),
      id: "schoolId",
      value: school.getId(),
    });
    tick();

    expect(component.entityBlockComponent).toEqual(School.getBlockComponent());
    expect(mockEntityMapper.load).toHaveBeenCalledWith(
      school.getType(),
      school.getId()
    );
    expect(component.entityToDisplay).toEqual(school);
  }));

  it("should navigate to the details page of the entity", fakeAsync(() => {
    component.entityToDisplay = new Child("1");

    component.showDetailsPage();

    expect(mockRouter.navigate).toHaveBeenCalledWith(["/child", "1"]);
  }));
});
