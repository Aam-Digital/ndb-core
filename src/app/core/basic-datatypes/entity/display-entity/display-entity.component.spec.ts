import { ComponentFixture, TestBed } from "@angular/core/testing";

import { DisplayEntityComponent } from "./display-entity.component";
import { EntityMapperService } from "../../../entity/entity-mapper/entity-mapper.service";
import { Child } from "../../../../child-dev-project/children/model/child";
import { ChildSchoolRelation } from "../../../../child-dev-project/children/model/childSchoolRelation";
import { School } from "../../../../child-dev-project/schools/model/school";
import {
  EntityRegistry,
  entityRegistry,
} from "../../../entity/database-entity.decorator";
import { Router } from "@angular/router";
import {
  componentRegistry,
  ComponentRegistry,
} from "../../../../dynamic-components";
import {
  mockEntityMapper,
  MockEntityMapperService,
} from "../../../entity/entity-mapper/mock-entity-mapper-service";
import { LoggingService } from "../../../logging/logging.service";

describe("DisplayEntityComponent", () => {
  let component: DisplayEntityComponent;
  let fixture: ComponentFixture<DisplayEntityComponent>;
  let entityMapper: MockEntityMapperService;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    entityMapper = mockEntityMapper();
    mockRouter = jasmine.createSpyObj(["navigate"]);
    await TestBed.configureTestingModule({
      imports: [DisplayEntityComponent],
      providers: [
        { provide: EntityMapperService, useValue: entityMapper },
        { provide: EntityRegistry, useValue: entityRegistry },
        { provide: ComponentRegistry, useValue: componentRegistry },
        { provide: Router, useValue: mockRouter },
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

  it("should use the block component when available", async () => {
    const school = new School();
    entityMapper.add(school);

    component.entity = new ChildSchoolRelation();
    component.id = "schoolId";
    component.value = school.getId();
    component.config = School.ENTITY_TYPE;
    await component.ngOnInit();

    expect(component.entityBlockComponent).toEqual(School.getBlockComponent());
    expect(component.entityToDisplay).toEqual(school);
  });

  it("should navigate to the details page of the entity", () => {
    component.entityToDisplay = new Child("1");

    component.showDetailsPage();

    expect(mockRouter.navigate).toHaveBeenCalledWith(["/child", "1"]);
  });

  it("should show entities which are not of the configured type", async () => {
    const child = new Child();
    entityMapper.add(child);
    component.entityId = child.getId(true);
    component.config = School.ENTITY_TYPE;

    await component.ngOnInit();

    expect(component.entityToDisplay).toEqual(child);
  });

  it("should log a warning if entity cannot be loaded", async () => {
    const warnSpy = spyOn(TestBed.inject(LoggingService), "warn");
    const child = new Child("not_existing");
    component.entityId = child.getId(true);
    component.config = School.ENTITY_TYPE;

    await component.ngOnInit();

    expect(warnSpy).toHaveBeenCalledWith(
      jasmine.stringContaining(child.getId(true)),
    );
    expect(component.entityToDisplay).toBeUndefined();
  });
});
