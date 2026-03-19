import { TestBed } from "@angular/core/testing";
import { PublicFormsService } from "./public-forms.service";
import { PublicFormConfig } from "./public-form-config";
import { Entity, EntityConstructor } from "app/core/entity/model/entity";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { EntityRegistry } from "app/core/entity/database-entity.decorator";
import { EntityConfigService } from "app/core/entity/entity-config.service";
import { AdminEntityService } from "app/core/admin/admin-entity.service";
import { TestEntity } from "../../utils/test-utils/TestEntity";
import type { Mock } from "vitest";

type EntityRegistryMock = {
  get: Mock;
};

type EntityConfigServiceMock = {
  getEntityConfig: Mock;
};

type AdminEntityServiceMock = {
  setAndSaveEntityConfig: Mock;
};

type MockSchemaField = {
  dataType: string;
  additional?: string;
};

describe("PublicFormsService", () => {
  let service: PublicFormsService;
  let mockEntityRegistry: EntityRegistryMock;
  let mockEntityConfigService: EntityConfigServiceMock;
  let mockAdminEntityService: AdminEntityServiceMock;

  function createMockEntityConstructor(
    schemaEntries: [string, MockSchemaField][],
  ): EntityConstructor {
    return {
      schema: new Map(schemaEntries),
    } as EntityConstructor;
  }

  beforeEach(() => {
    mockEntityRegistry = {
      get: vi.fn().mockName("EntityRegistry.get"),
    };
    mockEntityConfigService = {
      getEntityConfig: vi.fn().mockName("EntityConfigService.getEntityConfig"),
    };
    mockAdminEntityService = {
      setAndSaveEntityConfig: vi
        .fn()
        .mockName("AdminEntityService.setAndSaveEntityConfig"),
    };

    TestBed.configureTestingModule({
      providers: [
        {
          provide: EntityMapperService,
          useValue: {
            load: vi.fn(),
          },
        },
        {
          provide: EntityRegistry,
          useValue: mockEntityRegistry,
        },
        {
          provide: EntityConfigService,
          useValue: mockEntityConfigService,
        },
        {
          provide: AdminEntityService,
          useValue: mockAdminEntityService,
        },
      ],
    });

    // Mock clipboard API for tests using Object.defineProperty
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: vi.fn().mockReturnValue(Promise.resolve()),
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
    config.entity = "TestEntity";
    config.linkedEntities = ["children"];

    mockEntityRegistry.get.mockReturnValue(
      createMockEntityConstructor([
        ["children", { dataType: "entity", additional: "Child" }],
      ]),
    );

    const result = await service.copyPublicFormLinkFromConfig(config);
    expect(result).toBe(false); // No entity, no parameters
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      `${window.location.origin}/public-form/form/test-form`,
    );
  });

  it("should copy base URL when entity type does not match any linkedEntity", async () => {
    const config = new PublicFormConfig();
    config.route = "test-form";
    config.entity = "TestEntity";
    config.linkedEntities = ["children"];

    mockEntityRegistry.get.mockReturnValue(
      createMockEntityConstructor([
        ["children", { dataType: "entity", additional: "Child" }],
      ]),
    );

    const entity = new Entity();
    entity.getConstructor = vi.fn().mockReturnValue({
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
    config.entity = "TestEntity";
    config.linkedEntities = [];

    const entity = new Entity();
    entity.getConstructor = vi.fn().mockReturnValue({
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
    config.entity = "TestEntity";
    config.linkedEntities = ["children", "schools"];

    mockEntityRegistry.get.mockReturnValue(
      createMockEntityConstructor([
        ["children", { dataType: "entity", additional: "Child" }],
        ["schools", { dataType: "entity", additional: "School" }],
      ]),
    );

    const entity = new Entity();
    entity.getConstructor = vi.fn().mockReturnValue({
      ENTITY_TYPE: "Child",
    });
    entity.getId = vi.fn().mockReturnValue("Child:123");

    const result = await service.copyPublicFormLinkFromConfig(config, entity);
    expect(result).toBe(true);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      `${window.location.origin}/public-form/form/test-form?children=Child%3A123`,
    );
  });

  it("should copy URL with parameters for multiple matching entity types", async () => {
    const config = new PublicFormConfig();
    config.route = "test-form";
    config.entity = "TestEntity";
    config.linkedEntities = ["children", "schools"];

    mockEntityRegistry.get.mockReturnValue(
      createMockEntityConstructor([
        ["children", { dataType: "entity", additional: "Child" }],
        ["schools", { dataType: "entity", additional: "Child" }],
      ]),
    );

    const entity = new Entity();
    entity.getConstructor = vi.fn().mockReturnValue({
      ENTITY_TYPE: "Child",
    });
    entity.getId = vi.fn().mockReturnValue("Child:123");

    const result = await service.copyPublicFormLinkFromConfig(config, entity);
    expect(result).toBe(true);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      `${window.location.origin}/public-form/form/test-form?children=Child%3A123&schools=Child%3A123`,
    );
  });

  it("should not copy URL when linkedEntities exist but no matching type", async () => {
    const config = new PublicFormConfig();
    config.route = "test-form";
    config.entity = "TestEntity";
    config.linkedEntities = ["children", "schools"];

    mockEntityRegistry.get.mockReturnValue(
      createMockEntityConstructor([
        ["children", { dataType: "entity", additional: "Child" }],
        ["schools", { dataType: "entity", additional: "School" }],
      ]),
    );

    const entity = new Entity();
    entity.getConstructor = vi.fn().mockReturnValue({
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
    config.entity = "TestEntity";
    config.linkedEntities = ["children"];

    const entity = new Entity();
    // Entity without getConstructor method

    const result = await service.isEntityTypeLinkedToConfig(config, entity);
    expect(result).toBe(false);
  });

  it("should return false for isEntityTypeLinkedToConfig when config has no linkedEntities", async () => {
    const config = new PublicFormConfig();
    config.entity = "TestEntity";
    config.linkedEntities = [];

    const entity = new Entity();
    entity.getConstructor = vi.fn().mockReturnValue({
      ENTITY_TYPE: "Child",
    });

    const result = await service.isEntityTypeLinkedToConfig(config, entity);
    expect(result).toBe(false);
  });

  it("should return true for isEntityTypeLinkedToConfig when entity type matches linkedEntity additional property", async () => {
    const config = new PublicFormConfig();
    config.entity = "TestEntity";
    config.linkedEntities = ["children"];

    mockEntityRegistry.get.mockReturnValue(
      createMockEntityConstructor([
        ["children", { dataType: "entity", additional: "Child" }],
      ]),
    );

    const entity = new Entity();
    entity.getConstructor = vi.fn().mockReturnValue({
      ENTITY_TYPE: "Child",
    });

    const result = await service.isEntityTypeLinkedToConfig(config, entity);
    expect(result).toBe(true);
  });

  it("should return false for isEntityTypeLinkedToConfig when entity type does not match linkedEntity additional property", async () => {
    const config = new PublicFormConfig();
    config.entity = "TestEntity";
    config.linkedEntities = ["children"];

    mockEntityRegistry.get.mockReturnValue(
      createMockEntityConstructor([
        ["children", { dataType: "entity", additional: "Child" }],
      ]),
    );

    const entity = new Entity();
    entity.getConstructor = vi.fn().mockReturnValue({
      ENTITY_TYPE: "School",
    });

    const result = await service.isEntityTypeLinkedToConfig(config, entity);
    expect(result).toBe(false);
  });

  it("should return true for isEntityTypeLinkedToConfig when entity type matches any of multiple linkedEntities", async () => {
    const config = new PublicFormConfig();
    config.entity = "TestEntity";
    config.linkedEntities = ["children", "schools"];

    mockEntityRegistry.get.mockReturnValue(
      createMockEntityConstructor([
        ["children", { dataType: "entity", additional: "Child" }],
        ["schools", { dataType: "entity", additional: "School" }],
      ]),
    );

    const entity = new Entity();
    entity.getConstructor = vi.fn().mockReturnValue({
      ENTITY_TYPE: "School",
    });

    const result = await service.isEntityTypeLinkedToConfig(config, entity);
    expect(result).toBe(true);
  });

  it("should add new field to global schema when field is not in base schema", async () => {
    const publicFormConfig = new PublicFormConfig();
    publicFormConfig.entity = TestEntity.ENTITY_TYPE;

    // new custom field that doesn't exist in global config
    const newFieldId = "testField";
    TestEntity.schema.set(newFieldId, {
      label: "Test Field",
      dataType: "string",
    });

    mockEntityRegistry.get.mockReturnValue(TestEntity);
    // Global config only has the original TestEntity fields (name, other) but is missing our new testField
    mockEntityConfigService.getEntityConfig.mockReturnValue({
      attributes: {
        name: { label: "Name" },
        other: { label: "Other" },
      },
    });

    await service.saveCustomFieldsToEntityConfig(publicFormConfig);

    // Verify the new field is added to global schema via setAndSaveEntityConfig
    expect(mockAdminEntityService.setAndSaveEntityConfig).toHaveBeenCalledWith(
      TestEntity,
    );

    TestEntity.schema.delete(newFieldId);
  });

  it("should NOT update global schema when only existing field label is modified (local override)", async () => {
    const config = new PublicFormConfig();
    config.entity = TestEntity.ENTITY_TYPE;

    mockEntityRegistry.get.mockReturnValue(TestEntity);
    const attributes = {};
    for (const [fieldId, fieldDef] of TestEntity.schema.entries()) {
      attributes[fieldId] = { label: fieldDef.label };
    }
    mockEntityConfigService.getEntityConfig.mockReturnValue({
      attributes: attributes,
    });

    await service.saveCustomFieldsToEntityConfig(config);

    // should not call setAndSaveEntityConfig because all fields already exist in global schema
    expect(
      mockAdminEntityService.setAndSaveEntityConfig,
    ).not.toHaveBeenCalled();
  });

  it("should copy URL with parameters for multiple matching entity types", async () => {
    const config = new PublicFormConfig();
    config.route = "test-act2";
    config.forms = [
      {
        entity: "RecurringActivity",
        columns: [
          {
            fields: ["title", "assignedTo"],
          },
        ],
        linkedEntities: ["assignedTo"],
      },
    ];

    mockEntityRegistry.get.mockReturnValue(
      createMockEntityConstructor([
        ["assignedTo", { dataType: "entity", additional: "Child" }],
      ]),
    );

    const entity = new Entity();
    entity.getConstructor = vi.fn().mockReturnValue({
      ENTITY_TYPE: "Child",
    });
    entity.getId = vi.fn().mockReturnValue("Child:123");

    const result = await service.copyPublicFormLinkFromConfig(config, entity);
    expect(result).toBe(true);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      `${window.location.origin}/public-form/form/test-act2?assignedTo=Child%3A123`,
    );
  });
});
