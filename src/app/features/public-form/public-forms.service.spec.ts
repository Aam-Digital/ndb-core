import { TestBed } from "@angular/core/testing";
import { PublicFormsService } from "./public-forms.service";
import { PublicFormConfig } from "./public-form-config";
import { Entity } from "app/core/entity/model/entity";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { EntityRegistry } from "app/core/entity/database-entity.decorator";
import { EntityConfigService } from "app/core/entity/entity-config.service";

describe("PublicFormsService", () => {
  let service: PublicFormsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: EntityMapperService,
          useValue: jasmine.createSpyObj(["load"]),
        },
        {
          provide: EntityRegistry,
          useValue: jasmine.createSpyObj(["get"]),
        },
        {
          provide: EntityConfigService,
          useValue: jasmine.createSpyObj(["getEntityConfig"]),
        },
      ],
    });

    // Mock clipboard API for tests using Object.defineProperty
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: jasmine
          .createSpy("writeText")
          .and.returnValue(Promise.resolve()),
      },
      writable: true,
    });

    service = TestBed.inject(PublicFormsService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should copy base URL when no entity is provided", async () => {
    const config = new PublicFormConfig();
    config.route = "test-form";
    config.linkedEntities = [{ id: "children", additional: "Child" }];

    const result = await service.copyPublicFormLinkFromConfig(config);
    expect(result).toBe(false); // No entity, no parameters
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      `${window.location.origin}/public-form/form/test-form`,
    );
  });

  it("should copy base URL when entity type does not match any linkedEntity", async () => {
    const config = new PublicFormConfig();
    config.route = "test-form";
    config.linkedEntities = [{ id: "children", additional: "Child" }];

    const entity = new Entity();
    entity.getConstructor = jasmine.createSpy().and.returnValue({
      ENTITY_TYPE: "School", // Entity type does not match "Child"
    });

    const result = await service.copyPublicFormLinkFromConfig(config, entity);
    expect(result).toBe(false);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      `${window.location.origin}/public-form/form/test-form`,
    );
  });

  it("should copy base URL when config has no linkedEntities", async () => {
    const config = new PublicFormConfig();
    config.route = "test-form";
    config.linkedEntities = [];

    const entity = new Entity();
    entity.getConstructor = jasmine.createSpy().and.returnValue({
      ENTITY_TYPE: "Child",
    });

    const result = await service.copyPublicFormLinkFromConfig(config, entity);
    expect(result).toBe(false);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      `${window.location.origin}/public-form/form/test-form`,
    );
  });

  it("should copy URL with parameters for matching entity type", async () => {
    const config = new PublicFormConfig();
    config.route = "test-form";
    config.linkedEntities = [
      { id: "children", additional: "Child" },
      { id: "schools", additional: "School" },
    ];

    const entity = new Entity();
    entity.getConstructor = jasmine.createSpy().and.returnValue({
      ENTITY_TYPE: "Child",
    });
    entity.getId = jasmine.createSpy().and.returnValue("Child:123");

    const result = await service.copyPublicFormLinkFromConfig(config, entity);
    expect(result).toBe(true);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      `${window.location.origin}/public-form/form/test-form?children=Child%3A123`,
    );
  });

  it("should copy URL with parameters for multiple matching entity types", async () => {
    const config = new PublicFormConfig();
    config.route = "test-form";
    config.linkedEntities = [
      { id: "children", additional: "Child" },
      { id: "schools", additional: "Child" },
    ];

    const entity = new Entity();
    entity.getConstructor = jasmine.createSpy().and.returnValue({
      ENTITY_TYPE: "Child",
    });
    entity.getId = jasmine.createSpy().and.returnValue("Child:123");

    const result = await service.copyPublicFormLinkFromConfig(config, entity);
    expect(result).toBe(true);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      `${window.location.origin}/public-form/form/test-form?children=Child%3A123&schools=Child%3A123`,
    );
  });

  it("should not copy URL when linkedEntities exist but no matching type", async () => {
    const config = new PublicFormConfig();
    config.route = "test-form";
    config.linkedEntities = [
      { id: "children", additional: "Child" },
      { id: "schools", additional: "School" },
    ];

    const entity = new Entity();
    entity.getConstructor = jasmine.createSpy().and.returnValue({
      ENTITY_TYPE: "Note", // Entity type does not match any
    });

    const result = await service.copyPublicFormLinkFromConfig(config, entity);
    expect(result).toBe(false);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      `${window.location.origin}/public-form/form/test-form`,
    );
  });

  // Tests for isEntityTypeLinkedToConfig method
  it("should not return isEntityTypeLinkedToConfig when entity has no constructor", async () => {
    const config = new PublicFormConfig();
    config.linkedEntities = [{ id: "children", additional: "Child" }];

    const entity = new Entity();
    // Entity without getConstructor method

    const result = await service.isEntityTypeLinkedToConfig(config, entity);
    expect(result).toBe(false);
  });

  it("should return false for isEntityTypeLinkedToConfig when config has no linkedEntities", async () => {
    const config = new PublicFormConfig();
    config.linkedEntities = [];

    const entity = new Entity();
    entity.getConstructor = jasmine.createSpy().and.returnValue({
      ENTITY_TYPE: "Child",
    });

    const result = await service.isEntityTypeLinkedToConfig(config, entity);
    expect(result).toBe(false);
  });

  it("should return true for isEntityTypeLinkedToConfig when entity type matches linkedEntity additional property", async () => {
    const config = new PublicFormConfig();
    config.linkedEntities = [{ id: "children", additional: "Child" }];

    const entity = new Entity();
    entity.getConstructor = jasmine.createSpy().and.returnValue({
      ENTITY_TYPE: "Child",
    });

    const result = await service.isEntityTypeLinkedToConfig(config, entity);
    expect(result).toBe(true);
  });

  it("should return false for isEntityTypeLinkedToConfig when entity type does not match linkedEntity additional property", async () => {
    const config = new PublicFormConfig();
    config.linkedEntities = [{ id: "children", additional: "Child" }];

    const entity = new Entity();
    entity.getConstructor = jasmine.createSpy().and.returnValue({
      ENTITY_TYPE: "School",
    });

    const result = await service.isEntityTypeLinkedToConfig(config, entity);
    expect(result).toBe(false);
  });

  it("should return true for isEntityTypeLinkedToConfig when entity type matches any of multiple linkedEntities", async () => {
    const config = new PublicFormConfig();
    config.linkedEntities = [
      { id: "children", additional: "Child" },
      { id: "schools", additional: "School" },
    ];

    const entity = new Entity();
    entity.getConstructor = jasmine.createSpy().and.returnValue({
      ENTITY_TYPE: "School",
    });

    const result = await service.isEntityTypeLinkedToConfig(config, entity);
    expect(result).toBe(true);
  });
});
