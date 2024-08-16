import { Config } from "./config";
import { EntityConfig } from "../entity/entity-config";
import { RecurringActivity } from "../../child-dev-project/attendance/model/recurring-activity";

export function migrateAddMissingEntityAttributes(config: Config): Config {
  for (let entityType of Object.keys(DEFAULT_ENTITIES)) {
    // TODO: just blindly save all hard-coded fields into the entity config? or scan which ones are actually used?!
    if (!JSON.stringify(config).includes(`"${entityType}"`)) {
      // don't add config if the entity is never explicitly used or referenced
      continue;
    }
    applyDefaultFieldsForEntityConfig(config, entityType);
  }

  return config;
}

function applyDefaultFieldsForEntityConfig(config: Config, entityType: string) {
  if (!config.data["entity:" + entityType]) {
    config.data["entity:" + entityType] = {};
  }
  const entityConfig: EntityConfig = config.data["entity:" + entityType];

  const hardCodedConfig = DEFAULT_ENTITIES[entityType];

  entityConfig.label = entityConfig.label ?? hardCodedConfig.label;
  entityConfig.labelPlural =
    entityConfig.labelPlural ?? hardCodedConfig.labelPlural;
  entityConfig.icon = entityConfig.icon ?? hardCodedConfig.icon;
  entityConfig.toStringAttributes =
    entityConfig.toStringAttributes ?? hardCodedConfig.toStringAttributes;
  entityConfig.hasPII = entityConfig.hasPII ?? hardCodedConfig.hasPII;

  entityConfig.attributes = Object.assign(
    {},
    hardCodedConfig.attributes,
    entityConfig.attributes,
  );
}

const DEFAULT_ENTITIES = {
  User: {
    toStringAttributes: ["name"],
    icon: "user",
    label: "User",
    labelPlural: "Users",
    hasPII: true,
    attributes: {
      name: {
        dataType: "string",
        label: "Username",
        validators: {
          required: true,
          uniqueId: "User",
        },
      },
      phone: {
        dataType: "string",
        label: "Contact",
      },
    },
  },
  EducationalMaterial: {
    attributes: {
      child: {
        dataType: "entity",
        additional: "Child",
        entityReferenceRole: "composite",
      },
      date: {
        dataType: "date",
        label: "Date",
        defaultValue: {
          mode: "dynamic",
          value: "$now",
        },
      },
      materialType: {
        label: "Material",
        dataType: "configurable-enum",
        additional: "materials",
        validators: {
          required: true,
        },
      },
      materialAmount: {
        dataType: "number",
        label: "Amount",
        defaultValue: {
          mode: "static",
          value: 1,
        },
        validators: {
          required: true,
        },
      },
      description: {
        dataType: "string",
        label: "Description",
      },
    },
  },
  Todo: {
    toStringAttributes: ["subject"],
    icon: "check",
    label: "Task",
    labelPlural: "Tasks",
    hasPII: true,
    attributes: {
      subject: {
        dataType: "string",
        label: "Subject",
        showInDetailsView: true,
      },
      description: {
        dataType: "long-text",
        showInDetailsView: true,
        label: "Description",
      },
      deadline: {
        dataType: "date-only",
        showInDetailsView: true,
        anonymize: "retain",
        label: "Deadline",
      },
      startDate: {
        dataType: "date-only",
        description:
          "When you are planning to start work so that you keep enough time before the actual hard deadline.",
        showInDetailsView: true,
        anonymize: "retain",
        label: "Start Date",
      },
      assignedTo: {
        label: "Assigned to",
        dataType: "entity",
        isArray: true,
        additional: "User",
        showInDetailsView: true,
        defaultValue: {
          mode: "dynamic",
          value: "$current_user",
        },
        anonymize: "retain",
      },
      relatedEntities: {
        dataType: "entity",
        isArray: true,
        label: "Related Records",
        additional: ["Child", "School", "RecurringActivity"],
        entityReferenceRole: "composite",
        showInDetailsView: true,
        anonymize: "retain",
      },
      repetitionInterval: {
        label: "repeats",
        additional: [
          {
            label: "every week",
            interval: { amount: 1, unit: "week" },
          },
          {
            label: "every month",
            interval: { amount: 1, unit: "month" },
          },
        ],
        showInDetailsView: true,
        anonymize: "retain",
      },
      completed: {
        label: "completed",
        viewComponent: "DisplayTodoCompletion",
        anonymize: "retain",
      },
    },
  },
  School: {
    toStringAttributes: ["name"],
    icon: "university",
    label: "School",
    labelPlural: "Schools",
    color: "#9E9D24",
    attributes: {
      name: {
        dataType: "string",
        label: "Name",
        validators: {
          required: true,
        },
      },
    },
  },
  Aser: {
    hasPII: true,
    attributes: {
      child: {
        dataType: "entity",
        additional: "Child",
        entityReferenceRole: "composite",
      },
      date: {
        dataType: "date",
        label: "Date",
        defaultValue: {
          mode: "dynamic",
          value: "$now",
        },
        anonymize: "retain-anonymized",
      },
      hindi: {
        label: "Hindi",
        dataType: "configurable-enum",
        additional: "reading-levels",
      },
      bengali: {
        label: "Bengali",
        dataType: "configurable-enum",
        additional: "reading-levels",
      },
      english: {
        label: "English",
        dataType: "configurable-enum",
        additional: "reading-levels",
      },
      math: {
        label: "Math",
        dataType: "configurable-enum",
        additional: "math-levels",
      },
      remarks: {
        dataType: "string",
        label: "Remarks",
      },
    },
  },
  // TODO: the "bmi" column in view configs needs to be adapted manually (this is only used at a single client, however)
  HealthCheck: {
    hasPII: true,
    attributes: {
      child: {
        dataType: "entity",
        additional: "Child",
        entityReferenceRole: "composite",
        anonymize: "retain",
      },
      date: {
        dataType: "date",
        label: "Date",
        defaultValue: {
          mode: "dynamic",
          value: "$now",
        },
        anonymize: "retain-anonymized",
      },
      height: {
        dataType: "number",
        label: "Height [cm]",
        viewComponent: "DisplayUnit",
        additional: "cm",
      },
      weight: {
        dataType: "number",
        label: "Weight [kg]",
        viewComponent: "DisplayUnit",
        additional: "kg",
      },
    },
  },
  ChildSchoolRelation: {
    hasPII: true,
    attributes: {
      childId: {
        dataType: "entity",
        additional: "Child",
        entityReferenceRole: "composite",
        validators: {
          required: true,
        },
        anonymize: "retain",
        label: "Child",
      },
      schoolId: {
        dataType: "entity",
        additional: "School",
        entityReferenceRole: "aggregate",
        validators: {
          required: true,
        },
        anonymize: "retain",
        label: "School",
      },
      schoolClass: {
        dataType: "string",
        label: "Class",
      },
      start: {
        dataType: "date-only",
        label: "Start date",
        description: "The date a child joins a school",
        anonymize: "retain",
      },
      end: {
        dataType: "date-only",
        label: "End date",
        description: "The date of a child leaving the school",
        anonymize: "retain",
      },
      result: {
        dataType: "number",
        label: "Result",
        viewComponent: "DisplayPercentage",
        editComponent: "EditNumber",
        validators: {
          min: 0,
          max: 100,
        },
      },
    },
  },
  Child: {
    label: "Participant",
    labelPlural: "Participants",
    toStringAttributes: ["name"],
    icon: "child",
    color: "#1565C0",
    blockComponent: "ChildBlock",
    hasPII: true,
    attributes: {
      name: {
        dataType: "string",
        label: "Name",
        validators: {
          required: true,
        },
      },
      projectNumber: {
        dataType: "string",
        label: "Project Number",
        labelShort: "PN",
        searchable: true,
        anonymize: "retain",
      },
      dateOfBirth: {
        dataType: "date-with-age",
        label: "Date of birth",
        labelShort: "DoB",
        anonymize: "retain-anonymized",
      },
      center: {
        dataType: "configurable-enum",
        additional: "center",
        label: "Center",
        anonymize: "retain",
      },
      gender: {
        dataType: "configurable-enum",
        label: "Gender",
        additional: "genders",
        anonymize: "retain",
      },
      admissionDate: {
        dataType: "date-only",
        label: "Admission",
        anonymize: "retain-anonymized",
      },
      status: {
        dataType: "string",
        label: "Status",
      },
      dropoutDate: {
        dataType: "date-only",
        label: "Dropout Date",
        anonymize: "retain-anonymized",
      },
      dropoutType: {
        dataType: "string",
        label: "Dropout Type",
        anonymize: "retain",
      },
      dropoutRemarks: {
        dataType: "string",
        label: "Dropout remarks",
      },
      photo: {
        dataType: "file",
        label: "Photo",
        editComponent: "EditPhoto",
      },
      phone: {
        dataType: "string",
        label: "Phone Number",
      },
    },
  },
  RecurringActivity: {
    toStringAttributes: ["title"],
    label: "Recurring Activity",
    labelPlural: "Recurring Activities",
    color: "#00838F",
    route: "attendance/recurring-activity",
    attributes: {
      title: {
        dataType: "string",
        label: "Title",
        validators: {
          required: true,
        },
      },
      type: {
        label: "Type",
        dataType: "configurable-enum",
        additional: "interaction-type",
      },
      participants: {
        label: "Participants",
        dataType: "entity",
        isArray: true,
        additional: "Child",
      },
      linkedGroups: {
        label: "Groups",
        dataType: "entity",
        isArray: true,
        additional: "School",
      },
      excludedParticipants: {
        label: "Excluded Participants",
        dataType: "entity",
        isArray: true,
        additional: "Child",
      },
      assignedTo: {
        label: "Assigned user(s)",
        dataType: "entity",
        isArray: true,
        additional: "User",
      },
    },
  },
  Note: {
    toStringAttributes: ["subject"],
    label: "Note",
    labelPlural: "Notes",
    hasPII: true,
    attributes: {
      children: {
        label: "Children",
        dataType: "entity",
        isArray: true,
        additional: "Child",
        entityReferenceRole: "composite",
        editComponent: "EditAttendance",
        anonymize: "retain",
      },
      childrenAttendance: {
        dataType: "event-attendance-map",
        anonymize: "retain",
      },
      date: {
        label: "Date",
        dataType: "date-only",
        defaultValue: {
          mode: "dynamic",
          value: "$now",
        },
        anonymize: "retain",
      },
      subject: {
        dataType: "string",
        label: "Subject",
      },
      text: {
        dataType: "long-text",
        label: "Notes",
      },
      authors: {
        label: "SW",
        dataType: "entity",
        isArray: true,
        additional: "User",
        defaultValue: {
          mode: "dynamic",
          value: "$current_user",
        },
        anonymize: "retain",
      },
      category: {
        label: "Category",
        dataType: "configurable-enum",
        additional: "interaction-type",
        anonymize: "retain",
      },
      attachment: {
        label: "Attachment",
        dataType: "file",
      },
      relatesTo: {
        dataType: "entity",
        additional: "RecurringActivity",
        anonymize: "retain",
      },
      relatedEntities: {
        label: "Related Records",
        dataType: "entity",
        isArray: true,
        // by default no additional relatedEntities can be linked apart from children and schools, overwrite this in config to display (e.g. additional: "ChildSchoolRelation")
        additional: undefined,
        anonymize: "retain",
      },
      schools: {
        label: "Groups",
        dataType: "entity",
        isArray: true,
        additional: "School",
        entityReferenceRole: "composite",
        anonymize: "retain",
      },
      warningLevel: {
        label: "Status",
        dataType: "configurable-enum",
        additional: "warning-levels",
        anonymize: "retain",
      },
    },
  },
};
