import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EntityBlockComponent } from "./entity-block.component";
import { EntityMapperService } from "../../../entity/entity-mapper/entity-mapper.service";
import { Router } from "@angular/router";
import { Logging } from "../../../logging/logging.service";
import { TestEntity } from "../../../../utils/test-utils/TestEntity";
import { DatabaseException } from "../../../database/pouchdb/pouch-database";

describe("EntityBlockComponent", () => {
  let component: EntityBlockComponent;
  let fixture: ComponentFixture<EntityBlockComponent>;

  let mockRouter: jasmine.SpyObj<Router>;
  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;
  let testEntity: TestEntity;

  beforeEach(async () => {
    mockRouter = jasmine.createSpyObj(["navigate"]);
    mockEntityMapper = jasmine.createSpyObj(["load"]);

    testEntity = new TestEntity();
    mockEntityMapper.load.and.resolveTo(testEntity);

    await TestBed.configureTestingModule({
      imports: [EntityBlockComponent],
      providers: [
        { provide: EntityMapperService, useValue: mockEntityMapper },
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
    component.entityId = testEntity.getId();
    await component.ngOnInit();

    expect(component.entity).toEqual(testEntity);
  });

  it("should load the block config for tooltip when available", async () => {
    component.entity = testEntity;
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

    component.entityId = "Entity:404";
    mockEntityMapper.load.and.rejectWith(
      new DatabaseException(new Error(), "Entity not found"),
    );

    await component.ngOnInit();

    expect(logSpy).toHaveBeenCalledWith(
      jasmine.stringContaining("Could not find entity"),
      "Entity:404",
      jasmine.anything(),
    );
    expect(component.entity).toBeUndefined();
  });
});
