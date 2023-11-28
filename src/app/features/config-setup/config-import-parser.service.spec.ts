import { TestBed } from "@angular/core/testing";

import { ConfigImportParserService } from "./config-import-parser.service";
import { EntityConfig } from "../../core/entity/entity-config";
import { ConfigService } from "../../core/config/config.service";
import { ConfigFieldRaw } from "./config-field.raw";
import { EntityListConfig } from "../../core/entity-list/EntityListConfig";
import { EntityDetailsConfig } from "../../core/entity-details/EntityDetailsConfig";
import { ViewConfig } from "../../core/config/dynamic-routing/view-config.interface";
import { FieldConfig } from "../../core/entity/schema/entity-schema-field";

describe("ConfigImportParserService", () => {
  let service: ConfigImportParserService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ConfigService,
          useValue: jasmine.createSpyObj(["getAllConfigs"]),
        },
      ],
    });
    service = TestBed.inject(ConfigImportParserService);
  });

  function expectToBeParsedIntoEntityConfig(
    inputs: ConfigFieldRaw[],
    expectedOutputs: { [key: string]: FieldConfig },
  ) {
    const entityName = "test";
    const result = service.parseImportDefinition(inputs, entityName, false);

    const resultConfig = result["entity:" + entityName] as EntityConfig;
    expect(resultConfig?.attributes).toEqual(expectedOutputs);

    return result;
  }

  function expectToGenerateViewConfig(
    inputs: ConfigFieldRaw[],
    expectedOutputs: EntityListConfig | EntityDetailsConfig,
    detailsView: boolean,
  ) {
    const entityName = "test";
    const result = service.parseImportDefinition(inputs, entityName, false);

    const viewName = detailsView ? entityName + "/:id" : entityName;
    const resultConfig = result["view:" + viewName] as ViewConfig<
      EntityListConfig | EntityDetailsConfig
    >;

    if (detailsView) {
      expect(resultConfig?.component).toBe("EntityDetails");
    } else {
      expect(resultConfig?.component).toBe("EntityList");
    }

    expect(resultConfig.config).toEqual(expectedOutputs);

    return result;
  }

  it("should create entity config including all fields from definition", () => {
    const configImport_name: ConfigFieldRaw = {
      id: "firstname",
      label: "firstname",
      dataType: "string",
      additional_type_details: null,
      description: null,
    };
    const configImport_dob: ConfigFieldRaw = {
      id: "dateOfBirth",
      label: "date of birth",
      dataType: "date-only",
      additional_type_details: null,
      description: "some extra explanation",
    };

    expectToBeParsedIntoEntityConfig([configImport_name, configImport_dob], {
      [configImport_name.id]: {
        dataType: configImport_name.dataType,
        label: configImport_name.label,
      },
      [configImport_dob.id]: {
        dataType: configImport_dob.dataType,
        label: configImport_dob.label,
        description: configImport_dob.description,
      },
    });
  });

  it("should skip fields where dataType is not defined", () => {
    expectToBeParsedIntoEntityConfig(
      [
        {
          id: "ignored",
          label: "ignored",
          dataType: null,
        },
        {
          id: "name",
          label: "name",
          dataType: "string",
        },
      ],
      {
        name: {
          dataType: "string",
          label: "name",
        },
      },
    );
  });

  it("should generate id for field from label if not given", () => {
    expectToBeParsedIntoEntityConfig(
      [
        {
          id: null,
          label: "date of birth",
          dataType: "string",
        },
      ],
      {
        dateOfBirth: {
          dataType: "string",
          label: "date of birth",
        },
      },
    );
  });

  it("should generate sensible ids from labels", () => {
    const labelIdPairs = [
      ["name", "name"],
      ["Name", "name"],
      ["FirstName", "firstName"],
      ["name of", "nameOf"],
      ["test's name", "testsName"],
      ["name 123", "name123"],
      ["123 name", "123Name"], // this is possible in JavaScript
    ];

    for (const testCase of labelIdPairs) {
      const generatedId = ConfigImportParserService.generateIdFromLabel(
        testCase[0],
      );
      expect(generatedId).toBe(testCase[1]);
    }
  });

  it("should generate enum from additional column and reuse if already exists", () => {
    const parsedConfig = expectToBeParsedIntoEntityConfig(
      [
        {
          id: "hometown",
          label: "hometown",
          dataType: "enum",
          additional_type_details: "Berlin,Hongkong,New York,",
        },
        {
          id: "city",
          label: "city",
          dataType: "enum",
          additional_type_details: "Berlin,Hongkong,New York,",
        },
        {
          id: "missingEnum",
          label: "missing",
          dataType: "enum",
          additional_type_details: null,
        },
      ],
      {
        hometown: {
          dataType: "configurable-enum",
          label: "hometown",
          innerDataType: "hometown",
        },
        city: {
          dataType: "configurable-enum",
          label: "city",
          innerDataType: "hometown", // reuse the previous enum!
        },
        missingEnum: {
          dataType: "configurable-enum",
          label: "missing",
          innerDataType: ConfigImportParserService.NOT_CONFIGURED_KEY, // reuse the previous enum!
        },
      },
    );

    expect(parsedConfig["enum:hometown"]).toEqual([
      { id: "Berlin", label: "Berlin" },
      { id: "Hongkong", label: "Hongkong" },
      { id: "New York", label: "New York" },
    ]);
    expect(Object.keys(parsedConfig)).not.toContain("enum:city");
  });

  it("should generate list view with fields from config added to their columnGroups", () => {
    expectToGenerateViewConfig(
      [
        {
          id: "name",
          label: "name",
          dataType: "string",
          show_in_list: "Basic Info",
        },
        {
          id: "admissionDate",
          label: "admission date",
          dataType: "date-only",
          show_in_list: "Status",
        },
        {
          id: "phone",
          label: "phone",
          dataType: "number",
          show_in_list: "Basic Info, Status",
        },
      ],
      {
        title: "",
        entity: "test",
        columns: [],
        columnGroups: {
          groups: [
            { name: "Basic Info", columns: ["name", "phone"] },
            { name: "Status", columns: ["admissionDate", "phone"] },
          ],
        },
      },
      false,
    );
  });

  it("should generate details view with fields from config", () => {
    expectToGenerateViewConfig(
      [
        {
          id: "name",
          label: "name",
          dataType: "string",
          show_in_details: "Overview",
        },
        {
          id: "admissionDate",
          label: "admission date",
          dataType: "date-only",
          show_in_details: "Overview",
        },
        {
          id: "phone",
          label: "phone",
          dataType: "number",
          show_in_details: "Contact Details",
        },
      ],
      {
        icon: "child",
        entity: "test",
        title: "",
        panels: [
          {
            title: "Overview",
            components: [
              {
                title: "",
                component: "Form",
                config: { cols: [["name", "admissionDate"]] },
              },
            ],
          },
          {
            title: "Contact Details",
            components: [
              { title: "", component: "Form", config: { cols: [["phone"]] } },
            ],
          },
        ],
      } as EntityDetailsConfig,
      true,
    );
  });

  it("should allow a field in multiple details view tabs", () => {
    expectToGenerateViewConfig(
      [
        {
          id: "name",
          label: "name",
          dataType: "string",
          show_in_details: "Overview,Other Tab",
        },
      ],
      {
        icon: "child",
        entity: "test",
        title: "",
        panels: [
          {
            title: "Overview",
            components: [
              {
                title: "",
                component: "Form",
                config: { cols: [["name"]] },
              },
            ],
          },
          {
            title: "Other Tab",
            components: [
              {
                title: "",
                component: "Form",
                config: { cols: [["name"]] },
              },
            ],
          },
        ],
      } as EntityDetailsConfig,
      true,
    );
  });

  xit("should group fields within a details view tab when giving group index", () => {
    // this use case is not implemented currently
    // because it is difficult to get consistent behaviour in case of mixing field group headers and indices
    // instead we can simply delete the generated headers manually and have a clean result

    expectToGenerateViewConfig(
      [
        {
          id: "name",
          label: "name",
          dataType: "string",
          show_in_details: "Overview",
        },
        {
          id: "phone",
          label: "phone",
          dataType: "string",
          show_in_details: "Overview:2",
        },
        {
          id: "email",
          label: "email",
          dataType: "string",
          show_in_details: "Overview:2",
        },
      ],
      {
        icon: "child",
        entity: "test",
        title: "",
        panels: [
          {
            title: "Overview",
            components: [
              {
                title: "",
                component: "Form",
                config: {
                  cols: [["name"], [], ["phone", "email"]],
                },
              },
            ],
          },
        ],
      } as EntityDetailsConfig,
      true,
    );
  });

  it("should group fields within a details view tab when giving group header", () => {
    expectToGenerateViewConfig(
      [
        {
          id: "name",
          label: "name",
          dataType: "string",
          show_in_details: "Overview",
        },
        {
          id: "phone",
          label: "phone",
          dataType: "string",
          show_in_details: "Overview:Contact Details",
        },
        {
          id: "email",
          label: "email",
          dataType: "string",
          show_in_details: "Overview:Contact Details",
        },
      ],
      {
        icon: "child",
        entity: "test",
        title: "",
        panels: [
          {
            title: "Overview",
            components: [
              {
                title: "",
                component: "Form",
                config: {
                  cols: [["name"], ["phone", "email"]],
                  headers: [null, "Contact Details"],
                },
              },
            ],
          },
        ],
      } as EntityDetailsConfig,
      true,
    );
  });
});
