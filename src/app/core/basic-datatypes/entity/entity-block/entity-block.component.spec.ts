import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EntityBlockComponent } from "./entity-block.component";
import { EntityMapperService } from "../../../entity/entity-mapper/entity-mapper.service";
import { Router } from "@angular/router";
import { Logging } from "../../../logging/logging.service";
import { TestEntity } from "../../../../utils/test-utils/TestEntity";
import { DatabaseException } from "../../../database/pouchdb/pouch-database";
import {
  EntityRegistry,
  entityRegistry,
} from "../../../entity/database-entity.decorator";
describe("EntityBlockComponent", () => {
  let component: EntityBlockComponent;
  let fixture: ComponentFixture<EntityBlockComponent>;

  let mockRouter: any;
  let mockEntityMapper: any;
  let testEntity: TestEntity;

  beforeEach(async () => {
    mockRouter = {
      navigate: vi.fn(),
    };
    mockEntityMapper = {
      load: vi.fn(),
    };

    testEntity = new TestEntity();
    mockEntityMapper.load.mockResolvedValue(testEntity);

    await TestBed.configureTestingModule({
      imports: [EntityBlockComponent],
      providers: [
        { provide: EntityMapperService, useValue: mockEntityMapper },
        { provide: Router, useValue: mockRouter },
        { provide: EntityRegistry, useValue: entityRegistry },
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
    fixture.componentRef.setInput("entityId", testEntity.getId());
    fixture.detectChanges();

    await vi.waitFor(() =>
      expect(component.entityResource.value()).toEqual(testEntity),
    );

    expect(component.entityResource.value()).toEqual(testEntity);
  });

  it("should load the block config for tooltip when available", async () => {
    fixture.componentRef.setInput("entity", testEntity);
    fixture.detectChanges();

    await vi.waitFor(() =>
      expect(component.entityBlockConfig()).toEqual(
        TestEntity.toBlockDetailsAttributes,
      ),
    );

    expect(component.entityBlockConfig()).toEqual(
      TestEntity.toBlockDetailsAttributes,
    );
  });

  it("should navigate to the details page of the entity", async () => {
    fixture.componentRef.setInput("entity", new TestEntity("1"));
    fixture.detectChanges();
    await vi.waitFor(() =>
      expect(component.entityResource.value()).toBeTruthy(),
    );

    component.showDetailsPage();

    expect(mockRouter.navigate).toHaveBeenCalledWith(["/c/test-entity", "1"]);
  });

  it("should log a warning if entity cannot be loaded", async () => {
    const logSpy = vi.spyOn(Logging, "debug");

    mockEntityMapper.load.mockRejectedValue(
      new DatabaseException(new Error(), "Entity not found"),
    );
    fixture.componentRef.setInput("entityId", "Entity:404");
    fixture.detectChanges();

    await vi.waitFor(() => expect(logSpy).toHaveBeenCalled());

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining("Could not find entity"),
      "Entity:404",
      expect.any(DatabaseException),
    );
    expect(component.entityResource.value()).toBeUndefined();
  });

  it("shows a '<type> not available' fallback when a referenced entity can't be loaded", async () => {
    mockEntityMapper.load.mockRejectedValue(new Error("not found"));
    fixture.componentRef.setInput("entityId", `${TestEntity.ENTITY_TYPE}:404`);
    fixture.detectChanges();

    await vi.waitFor(() => expect(component.notFound()).toBe(true));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain("not available");
  });

  it("shows the raw id instead of 'not available' when asked to", async () => {
    mockEntityMapper.load.mockRejectedValue(new Error("not found"));
    fixture.componentRef.setInput("entityId", `${TestEntity.ENTITY_TYPE}:404`);
    fixture.componentRef.setInput("showIdEntityId", true);
    fixture.detectChanges();

    await vi.waitFor(() => expect(component.notFound()).toBe(true));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      `${TestEntity.ENTITY_TYPE}:404`,
    );
    expect(fixture.nativeElement.textContent).not.toContain("not available");
  });

  it("renders the not-found fallback instead of throwing when entityId is not a string", async () => {
    // an Entity accidentally bound to [entityId] instead of [entity]: truthy, so it
    // reaches the loader, but not a string, so extractTypeFromId() rejects it.
    // typed as unknown rather than cast, so the boundary is explicit and the rest
    // of the test keeps full type checking.
    const runtimeInvalidEntityId: unknown = testEntity;
    mockEntityMapper.load.mockRejectedValue(new Error("not found"));
    fixture.componentRef.setInput("entityId", runtimeInvalidEntityId);
    fixture.detectChanges();

    await vi.waitFor(() => expect(component.notFound()).toBe(true));

    expect(() => component.missingEntityType()).not.toThrow();
    expect(component.missingEntityType()).toBeUndefined();
    expect(component.notFoundIcon()).toBe("diamond");
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  it("should display configured entity color on the icon", async () => {
    TestEntity.color = "#ff0000";
    try {
      fixture.componentRef.setInput("entity", testEntity);
      fixture.detectChanges();
      await vi.waitFor(() =>
        expect(component.entityResource.value()).toEqual(testEntity),
      );
      fixture.detectChanges();

      const icon: HTMLElement | null = fixture.nativeElement.querySelector(
        "app-fa-dynamic-icon",
      );
      expect(icon).not.toBeNull();
      expect(icon?.style.color).toBe("rgb(255, 0, 0)");
    } finally {
      delete (TestEntity as any).color;
    }
  });

  it("should not apply icon color when no color is configured", async () => {
    fixture.componentRef.setInput("entity", testEntity);
    fixture.detectChanges();
    await vi.waitFor(() =>
      expect(component.entityResource.value()).toEqual(testEntity),
    );
    fixture.detectChanges();

    const icon: HTMLElement | null = fixture.nativeElement.querySelector(
      "app-fa-dynamic-icon",
    );
    expect(icon).not.toBeNull();
    expect(icon?.style.color).toBe("");
  });
});
