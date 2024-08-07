import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EntityBlockComponent } from "./entity-block.component";
import { EntityMapperService } from "../../../entity/entity-mapper/entity-mapper.service";
import { Child } from "../../../../child-dev-project/children/model/child";
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
import { Logging } from "../../../logging/logging.service";

describe("DisplayEntityComponent", () => {
  let component: EntityBlockComponent;
  let fixture: ComponentFixture<EntityBlockComponent>;
  let entityMapper: MockEntityMapperService;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    entityMapper = mockEntityMapper();
    mockRouter = jasmine.createSpyObj(["navigate"]);
    await TestBed.configureTestingModule({
      imports: [EntityBlockComponent],
      providers: [
        { provide: EntityMapperService, useValue: entityMapper },
        { provide: EntityRegistry, useValue: entityRegistry },
        { provide: ComponentRegistry, useValue: componentRegistry },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EntityBlockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should load entity if only id is given", async () => {
    const school = new School();
    entityMapper.add(school);

    component.entityId = school.getId();
    await component.ngOnInit();

    expect(component.entityToDisplay).toEqual(school);
  });

  it("should use the block component when available", async () => {
    const school = new School();
    entityMapper.add(school);

    component.entityToDisplay = school;
    await component.ngOnInit();

    expect(component.entityBlockComponent).toEqual(School.getBlockComponent());
  });

  it("should navigate to the details page of the entity", () => {
    component.entityToDisplay = new Child("1");

    component.showDetailsPage();

    expect(mockRouter.navigate).toHaveBeenCalledWith(["/child", "1"]);
  });

  it("should log a warning if entity cannot be loaded", async () => {
    const logSpy = spyOn(Logging, "debug");
    const child = new Child("not_existing");
    component.entityId = child.getId();

    await component.ngOnInit();

    expect(logSpy).toHaveBeenCalledWith(
      jasmine.stringContaining("Could not find entity"),
      child.getId(),
      jasmine.anything(),
    );
    expect(component.entityToDisplay).toBeUndefined();
  });
});
