import { TestBed } from "@angular/core/testing";
import { ConfigService } from "app/core/config/config.service";
import { EntitySchemaService } from "app/core/entity/schema/entity-schema.service";
import { InteractionSchemaDatatype } from "./interaction-schema-datatype";
import { NoteConfigLoaderService } from "./note-config-loader.service";
import { NoteConfig } from "./note-config.interface";

describe("NoteConfigLoaderService", () => {
  let service: NoteConfigLoaderService;
  let configServiceSpy: jasmine.SpyObj<ConfigService>;
  let entitySchemaServiceSpy: jasmine.SpyObj<EntitySchemaService>;
  const testConfig: NoteConfig = {
    InteractionTypes: {
      NONE: { name: "" },
      TEST_1: { name: "Category 1" },
    },
  };

  beforeEach(() => {
    configServiceSpy = jasmine.createSpyObj("ConfigService", ["getConfig"]);
    entitySchemaServiceSpy = jasmine.createSpyObj("EntitySchemaService", [
      "registerSchemaDatatype",
    ]);
    configServiceSpy.getConfig.and.returnValue(testConfig);
    TestBed.configureTestingModule({
      providers: [
        NoteConfigLoaderService,
        { provide: ConfigService, useValue: configServiceSpy },
        { provide: EntitySchemaService, useValue: entitySchemaServiceSpy },
      ],
    });
    service = TestBed.inject(NoteConfigLoaderService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should call getConfig()", () => {
    expect(configServiceSpy.getConfig).toHaveBeenCalled();
  });

  it("should register type with EntitySchemaService", () => {
    expect(entitySchemaServiceSpy.registerSchemaDatatype).toHaveBeenCalledWith(
      new InteractionSchemaDatatype(testConfig)
    );
  });
});
