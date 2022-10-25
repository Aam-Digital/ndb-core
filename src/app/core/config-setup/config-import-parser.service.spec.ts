import { TestBed } from "@angular/core/testing";

import { ConfigImportParserService } from "./config-import-parser.service";
import { EntityConfig } from "../entity/entity-config.service";
import { EntitySchemaField } from "../entity/schema/entity-schema-field";
import { ConfigService } from "../config/config.service";
import { ConfigFieldRaw } from "./config-field.raw";
import { EntityListConfig } from "../entity-components/entity-list/EntityListConfig";
import { EntityDetailsConfig } from "../entity-components/entity-details/EntityDetailsConfig";

fdescribe("ConfigImportParserService", () => {
  let service: ConfigImportParserService;

  const dummyImportData = [
    {
      id: "firstname",
      label: "firstname",
      dataType: "string",
      additional_type_details: null,
      description: null,
      show_in_list: "Basic Information, Demographics",
      show_in_details: "Overview",
      remarks: null,
    },
    {
      id: "dateOfBirth",
      label: "date of birth",
      dataType: "date-only",
      additional_type_details: null,
      description: null,
      show_in_list: "Basic Information, Demographics",
      show_in_details: "Overview",
      remarks: null,
    },
    {
      id: "numberOfSiblings",
      label: "number of siblings",
      dataType: "number",
      additional_type_details: null,
      description: "How many sibling live in the same household?",
      show_in_list: "Demographics",
      show_in_details: "Family Background",
      remarks: null,
    },
    {
      id: "mothertongue",
      label: "mothertongue",
      dataType: "enum",
      additional_type_details: "Hindi, English, Marathi",
      description: null,
      show_in_list: "Demographics",
      show_in_details: "Overview",
      remarks: null,
    },
  ];

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
    expectedOutputs: { name: string; schema: EntitySchemaField }[]
  ) {
    const entityName = "test";
    const result = service.parseImportDefinition(inputs, entityName);

    const resultConfig = result["entity:" + entityName] as EntityConfig;
    expect(resultConfig?.attributes).toEqual(expectedOutputs);

    return result;
  }

  function expectToGenerateViewConfig(
    inputs: ConfigFieldRaw[],
    expectedOutputs: EntityListConfig | EntityDetailsConfig,
    detailsView: boolean
  ) {
    const entityName = "test";
    const result = service.parseImportDefinition(inputs, entityName);

    const viewName = detailsView ? entityName + "/:id" : entityName;
    const resultConfig = result["view:" + viewName];
    expect(resultConfig).toEqual(expectedOutputs);

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

    expectToBeParsedIntoEntityConfig(
      [configImport_name, configImport_dob],
      [
        {
          name: configImport_name.id,
          schema: {
            dataType: configImport_name.dataType,
            label: configImport_name.label,
          },
        },
        {
          name: configImport_dob.id,
          schema: {
            dataType: configImport_dob.dataType,
            label: configImport_dob.label,
            description: configImport_dob.description,
          },
        },
      ]
    );
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
      [
        {
          name: "name",
          schema: {
            dataType: "string",
            label: "name",
          },
        },
      ]
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
      [
        {
          name: "dateOfBirth",
          schema: {
            dataType: "string",
            label: "date of birth",
          },
        },
      ]
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
        testCase[0]
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
      [
        {
          name: "hometown",
          schema: {
            dataType: "configurable-enum",
            label: "hometown",
            innerDataType: "hometown",
          },
        },
        {
          name: "city",
          schema: {
            dataType: "configurable-enum",
            label: "city",
            innerDataType: "hometown", // reuse the previous enum!
          },
        },
        {
          name: "missingEnum",
          schema: {
            dataType: "configurable-enum",
            label: "missing",
            innerDataType: "???", // reuse the previous enum!
          },
        },
      ]
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
      false
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
        icon: "",
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
      true
    );
  });
});
