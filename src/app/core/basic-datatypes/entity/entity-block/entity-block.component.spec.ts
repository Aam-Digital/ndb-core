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
