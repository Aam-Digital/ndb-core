import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EntityBlockComponent } from "./entity-block.component";
import { EntityMapperService } from "../../../entity/entity-mapper/entity-mapper.service";
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
import { TestEntity } from "../../../../utils/test-utils/TestEntity";

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
    const entity = new TestEntity();
    entityMapper.add(entity);

    component.entityId = entity.getId();
    await component.ngOnInit();

    expect(component.entity).toEqual(entity);
  });

  it("should load the block config for tooltip when available", async () => {
    const entity = new TestEntity();
    entityMapper.add(entity);

    component.entity = entity;
    await component.ngOnInit();

    expect(component.entityBlockConfig).toEqual(
      TestEntity.toBlockDetailsAttributes,
    );
  });

  it("should navigate to the details page of the entity", () => {
    component.entity = new TestEntity("1");

    component.showDetailsPage();

    expect(mockRouter.navigate).toHaveBeenCalledWith([TestEntity.route, "1"]);
  });

  it("should log a warning if entity cannot be loaded", async () => {
    const logSpy = spyOn(Logging, "debug");
    const child = new TestEntity("not_existing");
    component.entityId = child.getId();

    await component.ngOnInit();

    expect(logSpy).toHaveBeenCalledWith(
      jasmine.stringContaining("Could not find entity"),
      child.getId(),
      jasmine.anything(),
    );
    expect(component.entity).toBeUndefined();
  });
});
