import { TestBed } from "@angular/core/testing";

import { ConfigMigrationService } from "./config-migration.service";
import { ConfigService } from "./config.service";
import { EntityMapperService } from "../entity/entity-mapper.service";

describe("ConfigMigrationService", () => {
  let service: ConfigMigrationService;
  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;

  beforeEach(() => {
    mockEntityMapper = jasmine.createSpyObj(["load", "save"]);
    TestBed.configureTestingModule({
      providers: [ConfigService],
    });
    service = TestBed.inject(ConfigMigrationService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("");
});

const testConfig = {
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
};

const expectedChildrenListConfig = {
  component: "ChildrenList",
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
  dataType: "configurable-enum", innerDataType: "center", labelShort: "Center"
};
