import { defaultAttendanceStatusTypes } from "./default-config/default-attendance-status-types";
import { defaultInteractionTypes } from "./default-config/default-interaction-types";
import { Child } from "../../child-dev-project/children/model/child";
import { School } from "../../child-dev-project/schools/model/school";
import { ChildSchoolRelation } from "../../child-dev-project/children/model/childSchoolRelation";
import { EventNote } from "../../child-dev-project/attendance/model/event-note";
import { genders } from "../../child-dev-project/children/model/genders";
import { materials } from "../../child-dev-project/educational-material/model/materials";
import { mathLevels } from "../../child-dev-project/aser/model/mathLevels";
import { readingLevels } from "../../child-dev-project/aser/model/readingLevels";
import { warningLevels } from "../../child-dev-project/warning-levels";
import { ratingAnswers } from "../../features/historical-data/rating-answers";

// prettier-ignore
export const defaultJsonConfig = {
  "navigationMenu": {
    "items": [
      {
        "name": "Dashboard",
        "icon": "home",
        "link": "/"
      },
      {
        "name": "Children",
        "icon": "child",
        "link": "/child"
      },
      {
        "name": "Schools",
        "icon": "university",
        "link": "/school"
      },
      {
        "name": "Recurring Activities",
        "icon": "calendar",
        "link": "/recurring-activity"
      },
      {
        "name": "Record Attendance",
        "icon": "calendar-check-o",
        "link": "/attendance/add/day"
      },
      {
        "name": "Manage Attendance",
        "icon": "table",
        "link": "/attendance"
      },
      {
        "name": "Notes",
        "icon": "file-text",
        "link": "/note"
      },
      {
        "name": "Admin",
        "icon": "wrench",
        "link": "/admin"
      },
      {
        "name": "Users",
        "icon": "user",
        "link": "/users"
      },
      {
        "name": "Reports",
        "icon": "line-chart",
        "link": "/report"
      },
      {
        "name": "Database Conflicts",
        "icon": "wrench",
        "link": "/admin/conflicts"
      },
      {
        "name": "Help",
        "icon": "question-circle",
        "link": "/help"
      }
    ]
  },


  "enum:interaction-type": defaultInteractionTypes,
  "enum:attendance-status": defaultAttendanceStatusTypes,
  "enum:reading-levels": readingLevels,
  "enum:math-levels": mathLevels,
  "enum:genders": genders,
  "enum:materials": materials,
  "enum:warning-levels": warningLevels,
  "enum:document-status": [
    {
      "id": "",
      "label": ""
    },
    {
      "id": "OK (copy with us)",
      "label": "OK (copy with us)"
    },
    {
      "id": "OK (copy needed for us)",
      "label": "OK (copy needed for us)"
    },
    {
      "id": "needs correction",
      "label": "needs correction"
    },
    {
      "id": "applied",
      "label": "applied"
    },
    {
      "id": "doesn't have",
      "label": "doesn't have"
    },
    {
      "id": "not eligible",
      "label": "not eligible"
    }
  ],
  "enum:center": [
    {
      "id": "alipore",
      "label": "Alipore"
    },
    {
      "id": "tollygunge",
      "label": "Tollygunge"
    },
    {
      "id": "barabazar",
      "label": "Barabazar"
    }
  ],
  "enum:rating-answer": ratingAnswers,

  "view:": {
    "component": "Dashboard",
    "config": {
      "widgets": [
        {
          "component": "DashboardShortcutWidget",
          "config": {
            "shortcuts": [
              {
                "label": "Record Attendance",
                "icon": "calendar-check-o",
                "link": "/attendance/add/day",
              }
            ]
          }
        },
        {
          "component": "ChildrenCountDashboard"
        },
        {
          "component": "RecentNotesDashboard"
        },
        {
          "component": "NoRecentNotesDashboard",
          "config": {
            "sinceDays": 28,
            "fromBeginningOfWeek": false
          }
        },
        {
          "component": "AttendanceWeekDashboard",
          "config": {
            "daysOffset": 0,
            "periodLabel": "last week"
          }
        },
        {
          "component": "AttendanceWeekDashboard",
          "config": {
            "daysOffset": 7,
            "periodLabel": "this week"
          }
        },
        {
          "component": "ProgressDashboard",
          "config": {
            "dashboardConfigId": "1"
          }
        }
      ]
    }
  },
  "view:user": {
    "component": "UserAccount"
  },
  "view:note": {
    "component": "NotesManager",
    "config": {
      "title": "Notes & Reports",
      "includeEventNotes": false,
      "showEventNotesToggle": true,
      "columns": [
        {
          "id": "children",
          "noSorting": true
        }
      ],
      "columnGroups": {
        "default": "Standard",
        "mobile": "Mobile",
        "groups": [
          {
            "name": "Standard",
            "columns": [
              "date",
              "subject",
              "category",
              "authors",
              "children"
            ]
          },
          {
            "name": "Mobile",
            "columns": [
              "date",
              "subject",
              "children"
            ]
          }
        ]
      },
      "filters": [
        {
          "id": "status",
          "type": "prebuilt"
        },
        {
          "id": "date",
          "type": "prebuilt"
        },
        {
          "id": "category",
          "display": "dropdown"
        }
      ]
    }
  },
  "view:admin": {
    "component": "Admin",
    "requiresAdmin": true
  },
  "view:users": {
    "component": "UserList",
    "requiresAdmin": true
  },
  "view:admin/conflicts": {
    "component": "ConflictResolution",
    "requiresAdmin": true,
    "lazyLoaded":  true
  },
  "view:help": {
    "component": "Help"
  },
  "view:attendance": {
    "component": "AttendanceManager"
  },
  "view:attendance/add/day": {
    "component": "AddDayAttendance"
  },
  "view:school": {
    "component": "SchoolsList",
    "config": {
      "title": "Schools List",
      "columns": [
        "name",
        "medium",
        "privateSchool",
        "academicBoard",
        "upToClass"
      ],
      "filters": [
        {
          "id": "medium"
        },
        {
          "id": "privateSchool",
          "true": "Private School",
          "false": "Government School",
          "all": "All"
        }
      ]
    }
  },
  "view:school/:id": {
    "component": "EntityDetails",
    "config": {
      "entity": "School",
      "panels": [
        {
          "title": "Basic Information",
          "components": [
            {
              "title": "",
              "component": "Form",
              "config": {
                "cols": [
                  ["name"],
                  ["medium"],
                  ["privateSchool"],
                  ["academicBoard"],
                  ["phone"],
                  ["address"],
                  ["website"],
                  ["timing"],
                  ["workingDays"],
                  ["upToClass"],
                  ["remarks"]
                ]
              }
            }
          ]
        },
        {
          "title": "Students",
          "components": [
            {
              "title": "",
              "component": "ChildrenOverview"
            }
          ]
        }
      ],
      "icon": "university"
    }
  },
  "view:child": {
    "component": "ChildrenList",
    "config": {
      "title": "Children List",
      "columns": [
        {
          "view": "ChildBlock",
          "label": "Name",
          "id": "name"
        },
        {
          "view": "DisplayText",
          "label": "Age",
          "id": "age"
        },
        {
          "view": "DisplayText",
          "label": "Class",
          "id": "schoolClass"
        },
        {
          "view": "DisplayEntity",
          "label": "School",
          "id": "schoolId",
          "additional": `${School.ENTITY_TYPE}`,
          "noSorting": true
        },
        {
          "view": "RecentAttendanceBlocks",
          "label": "Attendance (School)",
          "id": "schoolAttendance",
          "additional": {
            "filterByActivityType": "SCHOOL_CLASS"
          },
          "noSorting": true
        },
        {
          "view": "RecentAttendanceBlocks",
          "label": "Attendance (Coaching)",
          "id": "coachingAttendance",
          "additional": {
            "filterByActivityType": "COACHING_CLASS"
          },
          "noSorting": true
        },
        {
          "view": "BmiBlock",
          "label": "BMI",
          "id": "health_BMI",
          "noSorting": true
        }
      ],
      "columnGroups": {
        "default": "School Info",
        "mobile": "Mobile",
        "groups": [
          {
            "name": "Basic Info",
            "columns": [
              "projectNumber",
              "name",
              "age",
              "gender",
              "schoolClass",
              "schoolId",
              "center",
              "status"
            ]
          },
          {
            "name": "School Info",
            "columns": [
              "projectNumber",
              "name",
              "age",
              "schoolClass",
              "schoolId",
              "schoolAttendance",
              "coachingAttendance",
              "motherTongue"
            ]
          },
          {
            "name": "Status",
            "columns": [
              "projectNumber",
              "name",
              "center",
              "status",
              "admissionDate",
              "has_aadhar",
              "has_kanyashree",
              "has_bankAccount",
              "has_rationCard",
              "has_BplCard"
            ]
          },
          {
            "name": "Health",
            "columns": [
              "projectNumber",
              "name",
              "center",
              "health_BMI",
              "health_bloodGroup",
              "health_lastDentalCheckup",
              "health_lastDeworming",
              "gender",
              "age",
              "dateOfBirth"
            ]
          },
          {
            "name": "Mobile",
            "columns": [
              "projectNumber",
              "name",
              "age",
              "schoolId"
            ]
          }
        ]
      },
      "filters": [
        {
          "id": "isActive",
          "type": "boolean",
          "default": "true",
          "true": "Active Children",
          "false": "Inactive",
          "all": "All"
        },
        {
          "id": "center",
          "display": "dropdown"
        },
        {
          "id": "schoolId",
          "type": "School",
          "label": "School",
          "display": "dropdown"
        }
      ]
    }
  },
  "view:child/:id": {
    "component": "EntityDetails",
    "config": {
      "icon": "child",
      "entity": "Child",
      "panels": [
        {
          "title": "Basic Information",
          "components": [
            {
              "title": "",
              "component": "Form",
              "config": {
                "cols": [
                  ["photo"],
                  [
                    "name",
                    "projectNumber",
                    "center",
                    "status"
                  ],
                  [
                    "dateOfBirth",
                    "gender",
                    "motherTongue",
                    "religion"
                  ],
                  [
                    "admissionDate",
                    "has_aadhar",
                    "has_kanyashree",
                    "has_bankAccount",
                    "has_rationCard",
                    "has_BplCard"
                  ],
                  [
                    "address",
                    "phone",
                    "guardianName",
                    "preferredTimeForGuardianMeeting"
                  ]
                ]
              }
            }
          ]
        },
        {
          "title": "Education",
          "components": [
            {
              "title": "School History",
              "component": "PreviousSchools",
              "config": {
                "single": true,
                "columns": [
                  "schoolId",
                  "schoolClass",
                  "start",
                  "end",
                  "result",
                ],
              }
            },
            {
              "title": "ASER Results",
              "component": "Aser"
            }
          ]
        },
        {
          "title": "Attendance",
          "components": [
            {
              "title": "",
              "component": "GroupedChildAttendance"
            }
          ]
        },
        {
          "title": "Notes & Reports",
          "components": [
            {
              "title": "",
              "component": "NotesOfChild"
            }
          ]
        },
        {
          "title": "Health",
          "components": [
            {
              "title": "",
              "component": "Form",
              "config": {
                "cols": [
                  ["health_bloodGroup"],
                  ["health_lastDentalCheckup"],
                  ["health_lastDeworming"]
                ]
              }
            },
            {
              "title": "Height & Weight Tracking",
              "component": "HealthCheckup"
            }
          ]
        },
        {
          "title": "Educational Materials",
          "components": [
            {
              "title": "",
              "component": "EducationalMaterial"
            }
          ]
        },
        {
          title: "Observations",
          components: [
            {
              title: "",
              component: "HistoricalDataComponent",
              config: [
                "date",
                "isMotivatedDuringClass" ,
                "isParticipatingInClass",
                "isInteractingWithOthers",
                "doesHomework",
                "isOnTime",
                "asksQuestions",
                "listens",
                "canWorkOnBoard",
                "isConcentrated",
                "doesNotDisturb",
              ]
            }
          ]
        },
        {
          "title": "Dropout",
          "components": [
            {
              "title": "",
              "component": "Form",
              "config": {
                "cols": [
                  ["dropoutDate"],
                  ["dropoutType"],
                  ["dropoutRemarks"]
                ]
              }
            }
          ]
        }
      ]
    }
  },

  "view:recurring-activity": {
    "component": "ActivityList",
    "config": {
      "title": "Recurring Activities",
      "columns": [
        "title",
        "type",
        "assignedTo"
      ],
    }
  },
  "view:recurring-activity/:id": {
    "component": "EntityDetails",
    "config": {
      "entity": "RecurringActivity",
      "panels": [
        {
          "title": "Activity",
          "components": [
            {
              "component": "Form",
              "config": {
                "cols": [
                  ["title"],
                  ["type"],
                  ["assignedTo"]
                ]
              }
            }
          ]
        },
        {
          "title": "Participants",
          "components": [
            {
              "component": "Form",
              "config": {
                "cols": [[
                  "linkedGroups",
                  "participants"
                ]]
              }
            }
          ]
        },
        {
          "title": "Events & Attendance",
          "components": [
            {
              "component": "ActivityAttendanceSection"
            }
          ]
        }
      ],
      "icon": "calendar"
    }
  },
  "view:report": {
    "component": "Reporting",
    "config": {
      "reports": [
        {
          "title": "Basic Report",
          "aggregationDefinitions": [
            {
              "query": `${Child.ENTITY_TYPE}:toArray[*isActive=true]`,
              "label": "All children",
              "aggregations": [
                {"label": "Male children", "query": `:filterByObjectAttribute(gender, id, M)`},
                {"label": "Female children", "query": `:filterByObjectAttribute(gender, id, F)`},
              ]
            },
            {
              "query": `${School.ENTITY_TYPE}:toArray`,
              "label": "All schools",
              "aggregations": [
                {"label": "Children attending a school", "query": `:getRelated(${ChildSchoolRelation.ENTITY_TYPE}, schoolId)[*isActive=true].childId:unique`},
                {"label": "Governmental schools", "query": `[*privateSchool!=true]`},
                {
                  "query": `[*privateSchool!=true]:getRelated(${ChildSchoolRelation.ENTITY_TYPE}, schoolId)[*isActive=true].childId:addPrefix(${Child.ENTITY_TYPE}):unique:toEntities`,
                  "label": "Children attending a governmental school",
                  "aggregations": [
                    {"label": "Male children attending a governmental school", "query": `:filterByObjectAttribute(gender, id, M)`},
                    {"label": "Female children attending a governmental school", "query": `:filterByObjectAttribute(gender, id, F)`},
                  ]
                },
                {"label": "Private schools", "query": `[*privateSchool=true]`},
                {
                  "query": `[*privateSchool=true]:getRelated(${ChildSchoolRelation.ENTITY_TYPE}, schoolId)[*isActive=true].childId:addPrefix(${Child.ENTITY_TYPE}):unique:toEntities`,
                  "label": "Children attending a private school",
                  "aggregations": [
                    {"label": "Male children attending a private school", "query": `:filterByObjectAttribute(gender, id, M)`},
                    {"label": "Female children attending a private school", "query": `:filterByObjectAttribute(gender, id, F)`},
                  ]
                },
              ]
            }
          ],
        },
        {
          "title": "Event Report",
          "aggregationDefinitions": [
            {
              "query": `${EventNote.ENTITY_TYPE}:toArray[*date >= ? & date <= ?]`,
              "groupBy": ["category"],
              "label": "Events",
              "aggregations": [
                {
                  "query": `:getParticipantsWithAttendance(PRESENT):unique:addPrefix(${Child.ENTITY_TYPE}):toEntities`,
                  "groupBy": ["gender", "religion"],
                  "label": "Participants"
                }
              ]
            }
          ],
        }
      ]
    }
  },

  "entity:Child": {
    "permissions": {
    },
    "attributes": [
      {
        "name": "address",
        "schema": { "dataType": "string", label: "Address" }
      },
      {
        "name": "phone",
        "schema": { "dataType": "string", label: "Phone No." }
      },
      {
        "name": "guardianName",
        "schema": { "dataType": "string", label: "Guardians" }
      },
      {
        "name": "preferredTimeForGuardianMeeting",
        "schema": { "dataType": "string", label: "Preferred time for guardians meeting" }
      },
      {
        "name": "has_aadhar",
        "schema": { "dataType": "configurable-enum", "innerDataType": "document-status", label: "Aadhar" }
      },
      {
        "name": "has_bankAccount",
        "schema": { "dataType": "configurable-enum", "innerDataType": "document-status", label: "Bank Account" }
      },
      {
        "name": "has_kanyashree",
        "schema": { "dataType": "configurable-enum", "innerDataType": "document-status", label: "Kanyashree" }
      },
      {
        "name": "has_rationCard",
        "schema": { "dataType": "configurable-enum", "innerDataType": "document-status", label: "Ration Card" }
      },
      {
        "name": "has_BplCard",
        "schema": { "dataType": "configurable-enum", "innerDataType": "document-status", label: "BPL Card" }
      },
      {
        "name": "health_bloodGroup",
        "schema": { "dataType": "string", label: "Blood Group" }
      },
      {
        "name": "health_lastDentalCheckup",
        "schema": { "dataType": "Date", label: "Last Dental Check-Up" }
      },
      {
        "name": "health_lastDeworming",
        "schema": { "dataType": "Date", label: "Last De-Worming" }
      }
    ]
  },
  "entity:School": {
    "permissions": {
    }
  },
  "entity:HistoricalEntityData": {
    "attributes": [
      {
        "name": "isMotivatedDuringClass",
        "schema": {
          "dataType": "configurable-enum",
          "innerDataType": "rating-answer",
          label: "Motivated",
          description: "The child is motivated during the class."
        }
      },
      {
        "name": "isParticipatingInClass",
        "schema": {
          "dataType": "configurable-enum",
          "innerDataType": "rating-answer",
          label: "Participates",
          description: "The child is actively participating in the class."
        }
      },
      {
        "name": "isInteractingWithOthers",
        "schema": {
          "dataType": "configurable-enum",
          "innerDataType": "rating-answer",
          label: "Interacts",
          description: "The child interacts with other students during the class."
        }
      },
      {
        "name": "doesHomework",
        "schema": {
          "dataType": "configurable-enum",
          "innerDataType": "rating-answer",
          label: "Homework",
          description: "The child does its homework."
        }
      },
      {
        "name": "isOnTime",
        "schema": {
          "dataType": "configurable-enum",
          "innerDataType": "rating-answer",
          label: "On time",
          description: "The child is always on time for the class."
        }
      },
      {
        "name": "asksQuestions",
        "schema": {
          "dataType": "configurable-enum",
          "innerDataType": "rating-answer",
          label: "Asks",
          description: "The child is asking questions during the class."
        }
      },
      {
        "name": "listens",
        "schema": {
          "dataType": "configurable-enum",
          "innerDataType": "rating-answer",
          label: "Listens",
          description: "The child is listening during the class."
        }
      },
      {
        "name": "canWorkOnBoard",
        "schema": {
          "dataType": "configurable-enum",
          "innerDataType": "rating-answer",
          label: "Solves on board",
          description: "The child can solve exercises on the board."
        }
      },
      {
        "name": "isConcentrated",
        "schema": {
          "dataType": "configurable-enum",
          "innerDataType": "rating-answer",
          label: "Concentrated",
          description: "The child is concentrated during the class."
        }
      },
      {
        "name": "doesNotDisturb",
        "schema": {
          "dataType": "configurable-enum",
          "innerDataType": "rating-answer",
          label: "Not disturbing",
          description: "The child does not disturb the class."
        }
      },
    ]
  }
}
