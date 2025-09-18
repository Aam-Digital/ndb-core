import { TestBed } from "@angular/core/testing";

import { PublicFormsService } from "./public-forms.service";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";
import { PublicFormConfig } from "./public-form-config";
import { Entity } from "app/core/entity/model/entity";

describe("PublicFormsService", () => {
  let service: PublicFormsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: EntityMapperService,
          useValue: jasmine.createSpyObj(["load"]),
        },
      ],
    });

    service = TestBed.inject(PublicFormsService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should return linkedEntities array when available", () => {
    const config = new PublicFormConfig();
    config.linkedEntities = [{ id: "participant" }, { id: "event" }];
    config.linkedEntity = { id: "legacy" };

    // Access private method for testing
    const result = (service as any).getLinkedEntitiesFromConfig(config);

    expect(result).toEqual([{ id: "participant" }, { id: "event" }]);
  });

  it("should fall back to single linkedEntity when linkedEntities is empty", () => {
    const config = new PublicFormConfig();
    config.linkedEntity = { id: "participant" };

    const result = (service as any).getLinkedEntitiesFromConfig(config);

    expect(result).toEqual([{ id: "participant" }]);
  });

  it("should return empty array when no linked entities configured", () => {
    const config = new PublicFormConfig();

    const result = (service as any).getLinkedEntitiesFromConfig(config);

    expect(result).toEqual([]);
  });

  it("should filter out entities without id", () => {
    const config = new PublicFormConfig();
    config.linkedEntities = [
      { id: "participant" },
      { id: "" },
      { id: "event" },
    ];

    const result = (service as any).getLinkedEntitiesFromConfig(config);

    expect(result).toEqual([{ id: "participant" }, { id: "event" }]);
  });

  it("should build multiple query parameters for multiple linked entities", () => {
    const config = new PublicFormConfig();
    config.linkedEntities = [{ id: "participant" }, { id: "event" }];

    const entity = new Entity();
    // Use public method to set ID
    spyOn(entity, "getId").and.returnValue("TestEntity:123");

    const result = (service as any).buildQueryParametersForEntity(
      config,
      entity,
    );

    expect(result).toBe("participant=TestEntity%3A123&event=TestEntity%3A123");
  });

  it("should build single query parameter for single linked entity", () => {
    const config = new PublicFormConfig();
    config.linkedEntity = { id: "participant" };

    const entity = new Entity();
    spyOn(entity, "getId").and.returnValue("TestEntity:123");

    const result = (service as any).buildQueryParametersForEntity(
      config,
      entity,
    );

    expect(result).toBe("participant=TestEntity%3A123");
  });

  it("should return empty string when no linked entities", () => {
    const config = new PublicFormConfig();

    const entity = new Entity();
    spyOn(entity, "getId").and.returnValue("TestEntity:123");

    const result = (service as any).buildQueryParametersForEntity(
      config,
      entity,
    );

    expect(result).toBe("");
  });
});
