import { TestBed } from "@angular/core/testing";

import { ConfigMigrationService } from "./config-migration.service";
import { ConfigService } from "./config.service";
import { EntityMapperService } from "../entity/entity-mapper.service";
import { Config } from "./config";
import { EntityConfig } from "../entity/entity-config.service";

describe("ConfigMigrationService", () => {
  let service: ConfigMigrationService;
  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;
  let configService: ConfigService;

  beforeEach(async () => {
    mockEntityMapper = jasmine.createSpyObj(["load", "save"]);
    const config = new Config();
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
                          input: "entity-select",
                          id: "assignedTo",
                          entityType: "User",
                          placeholder: "Add coordinator...",
                          label: "Assigned to",
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
    };
    mockEntityMapper.load.and.resolveTo(config);
    TestBed.configureTestingModule({
      providers: [
        ConfigService,
        { provide: EntityMapperService, useValue: mockEntityMapper },
      ],
    });
    service = TestBed.inject(ConfigMigrationService);
    configService = TestBed.inject(ConfigService);
    await service.migrateConfig();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should migrate the list configs", async () => {
    const childrenListConfig = configService.getConfig("view:child");
    expect(childrenListConfig).toEqual(expectedChildrenListConfig);
    const childConfig = configService.getConfig<EntityConfig>("entity:Child");
    const centerSchema = childConfig.attributes.find(
      (attr) => attr.name === "center"
    );
    expect(centerSchema.schema).toEqual(expectedCenterSchema);
  });

  it("should migrate the details configs", async () => {
    const childDetailsConfig = configService.getConfig("view:child/:id");
    expect(childDetailsConfig).toEqual(expectedChildDetailsConfig);
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
        label: "Name",
        id: "name",
      },
      {
        view: "DisplayText",
        label: "Age",
        id: "age",
      },
      {
        view: "DisplayDate",
        label: "DoB",
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
        label: "Center",
        id: "center",
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
    ],
  },
};

const expectedCenterSchema = {
  dataType: "configurable-enum",
  innerDataType: "center",
  labelShort: "Center",
  label: "Center",
};

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
                    label: "Photo Filename",
                  },
                ],
                [
                  {
                    edit: "EditText",
                    id: "name",
                    label: "Name",
                    required: true,
                  },
                  {
                    edit: "EditConfigurableEnum",
                    id: "center",
                    label: "Center",
                    additional: "center",
                  },
                ],
                [
                  {
                    edit: "EditAge",
                    tooltip:
                      "This field is read-only. Edit Date of Birth to change age. Select Jan 1st if you only know the year of birth.",
                    id: "dateOfBirth",
                    label: "Date of Birth",
                  },
                  {
                    edit: "EditSelectable",
                    id: "gender",
                    label: "Gender",
                    additional: ["M", "F"],
                  },
                ],
                [
                  {
                    edit: "EditDate",
                    id: "admissionDate",
                    label: "Admission Date",
                  },
                ],
                [
                  {
                    edit: "EditLongText",
                    id: "address",
                    label: "Address",
                  },
                  {
                    edit: "EditEntityArray",
                    id: "assignedTo",
                    additional: "User",
                    label: "Assigned to",
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
                  label: "School",
                  view: "DisplayEntity",
                  edit: "EditSingleEntity",
                  additional: "School",
                },
                {
                  id: "schoolClass",
                  label: "Class",
                  view: "DisplayText",
                  edit: "EditText",
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
                {
                  id: "result",
                  label: "Result",
                  view: "DisplayPercentage",
                  edit: "EditPercentage",
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
                label: "Date",
                view: "DisplayDate",
                edit: "EditDate",
              },
              {
                id: "isMotivatedDuringClass",
                label: "Motivated",
                view: "DisplayConfigurableEnum",
                edit: "EditConfigurableEnum",
                additional: "rating-answer",
                tooltip: "The child is motivated during the class.",
              },
              {
                id: "observer",
                label: "Observer",
                view: "DisplayText",
                edit: "EditText",
                tooltip: "Name of the observer",
              },
            ],
          },
        ],
      },
      {
        title: "Participants",
        components: [
          {
            component: "Form",
            config: [
              {
                id: "linkedGroups",
                label: "Groups",
                view: "EditEntityArray",
                additional: "School",
              },
              {
                id: "participants",
                label: "Participants",
                view: "EditEntityArray",
                additional: "Child",
              },
            ],
          },
        ],
      },
    ],
  },
};
