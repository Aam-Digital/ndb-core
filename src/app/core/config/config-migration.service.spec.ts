import { TestBed } from "@angular/core/testing";

import { ConfigMigrationService } from "./config-migration.service";
import { ConfigService } from "./config.service";
import { EntityMapperService } from "../entity/entity-mapper.service";
import { Config } from "./config";
import {
  EntityConfig,
  EntityConfigService,
} from "../entity/entity-config.service";
import {
  CONFIGURABLE_ENUM_CONFIG_PREFIX,
  ConfigurableEnumValue,
} from "../configurable-enum/configurable-enum.interface";
import { genders } from "../../child-dev-project/children/model/genders";
import { EntitySchemaField } from "../entity/schema/entity-schema-field";
import { Child } from "../../child-dev-project/children/model/child";
import { HistoricalEntityData } from "../../features/historical-data/historical-entity-data";
import { DynamicEntityService } from "../entity/dynamic-entity.service";
import { EntitySchemaService } from "../entity/schema/entity-schema.service";

describe("ConfigMigrationService", () => {
  let service: ConfigMigrationService;
  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;
  let configService: ConfigService;
  let config: Config;

  beforeEach(async () => {
    config = new Config();
    config.data = {
      "view:child": {
        component: "ChildrenList",
        config: {
          title: "Children List",
          columns: [
            {
              component: "ChildBlock",
              title: "Name",
              id: "name",
            },
            {
              component: "DisplayText",
              title: "Age",
              id: "age",
            },
            {
              component: "DisplayDate",
              title: "DoB",
              id: "dateOfBirth",
            },
            {
              component: "SchoolBlockWrapper",
              title: "School",
              id: "schoolId",
            },
            {
              component: "DisplayText",
              title: "Gender",
              id: "gender",
            },
            {
              component: "RecentAttendanceBlocks",
              title: "Attendance (School)",
              id: "schoolAttendance",
              config: {
                filterByActivityType: "SCHOOL_CLASS",
              },
              noSorting: true,
            },
            {
              component: "DisplayConfigurableEnum",
              title: "Center",
              id: "center",
            },
            {
              component: "ChildBlockList",
              title: "Children",
              id: "children",
              noSorting: true,
            },
          ],
          columnGroup: {
            default: "School Info",
            mobile: "Mobile",
            groups: [
              {
                name: "Basic Info",
                columns: ["age", "name"],
              },
              {
                name: "School Info",
                columns: [
                  "name",
                  "schoolClass",
                  "schoolId",
                  "schoolAttendance",
                ],
              },
            ],
          },
          filters: [
            {
              id: "isActive",
              type: "boolean",
              default: "true",
              true: "Active Children",
              false: "Inactive",
              all: "All",
            },
            {
              id: "isActiveAll",
              type: "boolean",
              default: "",
              true: "Active Children",
              false: "Inactive",
              all: "All",
            },
            {
              id: "center",
              label: "Center",
              type: "configurable-enum",
              enumId: "center",
              display: "dropdown",
            },
            {
              id: "school",
              type: "prebuilt",
              label: "School",
              display: "dropdown",
            },
            {
              id: "assignedTo",
            },
          ],
        },
      },
      "view:child/:id": {
        component: "EntityDetails",
        config: {
          icon: "child",
          entity: "Child",
          panels: [
            {
              title: "Basic Information",
              components: [
                {
                  title: "",
                  component: "Form",
                  config: {
                    cols: [
                      [
                        {
                          input: "photo",
                          id: "photoFile",
                          placeholder: "Photo Filename",
                        },
                      ],
                      [
                        {
                          input: "text",
                          id: "name",
                          placeholder: "Name",
                          required: true,
                        },
                        {
                          input: "configurable-enum-select",
                          id: "center",
                          placeholder: "Center",
                          enumId: "center",
                        },
                      ],
                      [
                        {
                          input: "age",
                          tooltip:
                            "This field is read-only. Edit Date of Birth to change age. Select Jan 1st if you only know the year of birth.",
                          id: "dateOfBirth",
                          placeholder: "Date of Birth",
                        },
                        {
                          input: "select",
                          id: "gender",
                          placeholder: "Gender",
                          options: ["M", "F"],
                        },
                        {
                          input: "select",
                          id: "status",
                          placeholder: "Status",
                          options: ["Active", "Inactive", "Still Considering"],
                        },
                      ],
                      [
                        {
                          input: "datepicker",
                          id: "admissionDate",
                          placeholder: "Admission Date",
                        },
                      ],
                      [
                        {
                          input: "textarea",
                          id: "address",
                          placeholder: "Address",
                        },
                        {
                          input: "text",
                          id: "assignedTo",
                          placeholder: "Additional Information",
                        },
                        {
                          input: "entity-select",
                          id: "children",
                          entityType: "Child",
                          placeholder: "Add children...",
                          label: "Assigned children",
                        },
                      ],
                    ],
                  },
                },
              ],
            },
            {
              title: "Education",
              components: [
                {
                  title: "School History",
                  component: "PreviousSchools",
                  config: {
                    single: true,
                    columns: [
                      { id: "schoolId", label: "School", input: "school" },
                      { id: "schoolClass", label: "Class", input: "text" },
                      { id: "start", label: "From", input: "date" },
                      { id: "end", label: "To", input: "date" },
                      {
                        id: "result",
                        label: "Result",
                        input: "percentageResult",
                      },
                    ],
                  },
                },
                {
                  title: "Participation History",
                  component: "PreviousTeams",
                },
              ],
            },
            {
              title: "Observations",
              components: [
                {
                  title: "",
                  component: "HistoricalDataComponent",
                  config: [
                    {
                      name: "date",
                      label: "Date",
                      inputType: "date",
                    },
                    {
                      name: "isMotivatedDuringClass",
                      label: "Motivated",
                      inputType: "configurable_enum",
                      enumId: "rating-answer",
                      tooltip: "The child is motivated during the class.",
                    },
                    {
                      name: "observer",
                      label: "Observer",
                      inputType: "text",
                      tooltip: "Name of the observer",
                    },
                  ],
                },
                {
                  title: "",
                  component: "ChildrenOverview",
                  config: {
                    displayedColumns: ["name", "schoolClass", "age"],
                  },
                },

                {
                  title: "",
                  component: "Aser",
                  config: {
                    displayedColumns: ["date", "math", "hindi"],
                  },
                },
              ],
            },
            {
              title: "Participants",
              components: [
                {
                  component: "ActivityParticipantsSection",
                },
              ],
            },
          ],
        },
      },
      "entity:Child": {
        permissions: {},
        attributes: [
          {
            name: "children",
            schema: { dataType: "array", innerDataType: "string" },
          },
          {
            name: "assignedTo",
            schema: { dataType: "string" },
          },
          {
            name: "address",
            schema: { dataType: "string" },
          },
        ],
      },
      "entity:HistoricalEntityData": {
        permissions: {},
        attributes: [
          {
            name: "observer",
            schema: {
              dataType: "string",
            },
          },
          {
            name: "isMotivatedDuringClass",
            schema: {
              dataType: "configurable-enum",
              innerDataType: "rating-answer",
            },
          },
        ],
      },
    };
    mockEntityMapper = jasmine.createSpyObj(["load", "save"]);
    mockEntityMapper.load.and.resolveTo(config);
    mockEntityMapper.save.and.resolveTo();
    TestBed.configureTestingModule({
      providers: [
        EntityConfigService,
        ConfigService,
        EntitySchemaService,
        DynamicEntityService,
        { provide: EntityMapperService, useValue: mockEntityMapper },
      ],
    });
    service = TestBed.inject(ConfigMigrationService);
    configService = TestBed.inject(ConfigService);

    await configService.loadConfig(mockEntityMapper);
    const entityConfigService = TestBed.inject(EntityConfigService);
    entityConfigService.addConfigAttributes(Child);
    entityConfigService.addConfigAttributes(HistoricalEntityData);

    await service.migrateConfig();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should save the updated config with force update", () => {
    expect(mockEntityMapper.save).toHaveBeenCalledWith(config, true);
  });

  it("should migrate the list configs", async () => {
    const childrenListConfig = configService.getConfig("view:child");
    expect(childrenListConfig).toEqual(expectedChildrenListConfig);
    const childConfig = configService.getConfig<EntityConfig>("entity:Child");
    const centerSchema = childConfig.attributes.find(
      (attr) => attr.name === "center"
    ).schema;
    expect(centerSchema).toEqual(expectedCenterSchema);
  });

  it("should migrate the details configs", async () => {
    const childDetailsConfig = configService.getConfig("view:child/:id");
    expect(childDetailsConfig).toEqual(expectedChildDetailsConfig);

    const childConfig = configService.getConfig<EntityConfig>("entity:Child");
    const genderSchema = childConfig.attributes.find(
      (attr) => attr.name === "gender"
    ).schema;
    expect(genderSchema).toEqual(expectedGenderSchema);

    const statusSchema = childConfig.attributes.find(
      (attr) => attr.name === "status"
    ).schema;
    expect(statusSchema).toEqual(expectedStatusSchema);
    const statusEnum = configService.getConfig(
      CONFIGURABLE_ENUM_CONFIG_PREFIX + "status"
    );
    expect(statusEnum).toEqual(expectedStatusConfigurableEnum);

    const assignedToSchema = childConfig.attributes.find(
      (attr) => attr.name === "assignedTo"
    ).schema;
    expect(assignedToSchema).toEqual(expectedAssignedToSchema);
  });

  it("should add configurable enum configs", () => {
    const genderConfig = configService.getConfig(
      CONFIGURABLE_ENUM_CONFIG_PREFIX + "genders"
    );
    expect(genderConfig).toEqual(genders);
  });
});
const expectedChildrenListConfig = {
  component: "ChildrenList",
  _id: "view:child",
  config: {
    title: "Children List",
    columns: [
      {
        view: "ChildBlock",
        id: "name",
      },
      {
        view: "DisplayText",
        label: "Age",
        id: "age",
      },
      {
        view: "DisplayDate",
        id: "dateOfBirth",
      },
      {
        view: "DisplayEntity",
        label: "School",
        id: "schoolId",
        additional: "School",
        noSorting: true,
      },
      {
        id: "gender",
      },
      {
        view: "RecentAttendanceBlocks",
        label: "Attendance (School)",
        id: "schoolAttendance",
        additional: {
          filterByActivityType: "SCHOOL_CLASS",
        },
        noSorting: true,
      },
      {
        view: "DisplayConfigurableEnum",
        id: "center",
      },
      {
        view: "DisplayEntityArray",
        id: "children",
        additional: "Child",
        noSorting: true,
      },
    ],
    columnGroups: {
      default: "School Info",
      mobile: "Mobile",
      groups: [
        {
          name: "Basic Info",
          columns: ["age", "name"],
        },
        {
          name: "School Info",
          columns: ["name", "schoolClass", "schoolId", "schoolAttendance"],
        },
      ],
    },
    filters: [
      {
        id: "isActive",
        type: "boolean",
        default: "true",
        true: "Active Children",
        false: "Inactive",
        all: "All",
      },
      {
        id: "isActiveAll",
        type: "boolean",
        true: "Active Children",
        false: "Inactive",
        all: "All",
      },
      {
        id: "center",
        label: "Center",
        display: "dropdown",
      },
      {
        id: "schoolId",
        type: "School",
        label: "School",
        display: "dropdown",
      },
      {
        id: "assignedTo",
        type: "User",
        label: "Assigned user(s)",
        display: "dropdown",
      },
    ],
  },
};

const expectedCenterSchema: EntitySchemaField = {
  dataType: "configurable-enum",
  innerDataType: "center",
  labelShort: "Center",
  label: "Center",
};

const expectedGenderSchema: EntitySchemaField = {
  dataType: "configurable-enum",
  innerDataType: "genders",
  label: "Gender",
  labelShort: "Gender",
};

const expectedStatusSchema: EntitySchemaField = {
  dataType: "configurable-enum",
  innerDataType: "status",
  label: "Status",
};

const expectedAssignedToSchema: EntitySchemaField = {
  dataType: "array",
  innerDataType: "string",
  editComponent: "EditEntityArray",
  viewComponent: "DisplayEntityArray",
  additional: "User",
  label: "Assigned user(s)",
};

const expectedStatusConfigurableEnum: ConfigurableEnumValue[] = [
  {
    id: "",
    label: "",
  },
  {
    id: "Active",
    label: "Active",
  },
  {
    id: "Inactive",
    label: "Inactive",
  },
  {
    id: "Still Considering",
    label: "Still Considering",
  },
];

const expectedChildDetailsConfig = {
  component: "EntityDetails",
  _id: "view:child/:id",
  config: {
    icon: "child",
    entity: "Child",
    panels: [
      {
        title: "Basic Information",
        components: [
          {
            title: "",
            component: "Form",
            config: {
              cols: [
                [
                  {
                    edit: "EditPhoto",
                    id: "photo",
                  },
                ],
                [
                  {
                    edit: "EditText",
                    id: "name",
                    required: true,
                  },
                  {
                    edit: "EditConfigurableEnum",
                    id: "center",
                    additional: "center",
                  },
                ],
                [
                  {
                    edit: "EditAge",
                    tooltip:
                      "This field is read-only. Edit Date of Birth to change age. Select Jan 1st if you only know the year of birth.",
                    id: "dateOfBirth",
                  },
                  {
                    id: "gender",
                  },
                  {
                    id: "status",
                  },
                ],
                [
                  {
                    edit: "EditDate",
                    id: "admissionDate",
                  },
                ],
                [
                  {
                    edit: "EditLongText",
                    id: "address",
                  },
                  {
                    id: "assignedTo",
                  },
                  {
                    edit: "EditEntityArray",
                    id: "children",
                    additional: "Child",
                  },
                ],
              ],
            },
          },
        ],
      },
      {
        title: "Education",
        components: [
          {
            title: "School History",
            component: "PreviousSchools",
            config: {
              single: true,
              columns: [
                {
                  id: "schoolId",
                  view: "DisplayEntity",
                  edit: "EditSingleEntity",
                  additional: "School",
                },
                {
                  id: "schoolClass",
                  edit: "EditText",
                },
                {
                  id: "start",
                  view: "DisplayDate",
                  edit: "EditDate",
                },
                {
                  id: "end",
                  view: "DisplayDate",
                  edit: "EditDate",
                },
                {
                  id: "result",
                  view: "DisplayPercentage",
                  edit: "EditNumber",
                },
              ],
            },
          },
          {
            title: "Participation History",
            component: "PreviousSchools",
            config: {
              single: false,
              columns: [
                {
                  id: "schoolId",
                  label: "Team",
                  view: "DisplayEntity",
                  edit: "EditSingleEntity",
                  additional: "Team",
                },
                {
                  id: "start",
                  label: "From",
                  view: "DisplayDate",
                  edit: "EditDate",
                },
                {
                  id: "end",
                  label: "To",
                  view: "DisplayDate",
                  edit: "EditDate",
                },
              ],
            },
          },
        ],
      },
      {
        title: "Observations",
        components: [
          {
            title: "",
            component: "HistoricalDataComponent",
            config: [
              {
                id: "date",
                view: "DisplayDate",
                edit: "EditDate",
              },
              {
                id: "isMotivatedDuringClass",
                view: "DisplayConfigurableEnum",
                edit: "EditConfigurableEnum",
                additional: "rating-answer",
                tooltip: "The child is motivated during the class.",
              },
              {
                id: "observer",
                edit: "EditText",
                tooltip: "Name of the observer",
              },
            ],
          },
          {
            title: "",
            component: "ChildrenOverview",
            config: {
              columns: [
                "name",
                { id: "schoolClass", label: "Class", view: "DisplayText" },
                { id: "age", label: "Age", view: "DisplayText" },
              ],
            },
          },
          {
            title: "",
            component: "Aser",
            config: {
              columns: [
                { id: "date", visibleFrom: "xs" },
                { id: "math", visibleFrom: "xs" },
                { id: "hindi", visibleFrom: "md" },
              ],
            },
          },
        ],
      },
      {
        title: "Participants",
        components: [
          {
            component: "Form",
            config: {
              cols: [
                [
                  {
                    id: "linkedGroups",
                    label: "Groups",
                    edit: "EditEntityArray",
                    additional: "School",
                  },
                  {
                    id: "participants",
                    label: "Participants",
                    edit: "EditEntityArray",
                    additional: "Child",
                  },
                ],
              ],
            },
          },
        ],
      },
    ],
  },
};
