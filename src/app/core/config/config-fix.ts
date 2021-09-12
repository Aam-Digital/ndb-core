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
import { Note } from "../../child-dev-project/notes/model/note";

// prettier-ignore
export const defaultJsonConfig = {
  "appConfig": {
    displayLanguageSelect: true,
  },
  "navigationMenu": {
    "items": [
      {
        "name": $localize`:Menu item:Dashboard`,
        "icon": "home",
        "link": "/"
      },
      {
        "name": $localize`:Menu item:Children`,
        "icon": "child",
        "link": "/child"
      },
      {
        "name": $localize`:Menu item:Schools`,
        "icon": "university",
        "link": "/school"
      },
      {
        "name": $localize`:Menu item:Recurring Activities`,
        "icon": "calendar",
        "link": "/recurring-activity"
      },
      {
        "name": $localize`:Menu item|Record attendance menu item:Record Attendance`,
        "icon": "calendar-check-o",
        "link": "/attendance/add/day"
      },
      {
        "name": $localize`:Menu item:Manage Attendance`,
        "icon": "table",
        "link": "/attendance"
      },
      {
        "name": $localize`:Menu item:Notes`,
        "icon": "file-text",
        "link": "/note"
      },
      {
        "name": $localize`:Menu item:Admin`,
        "icon": "wrench",
        "link": "/admin"
      },
      {
        "name": $localize`:Menu item:Users`,
        "icon": "user",
        "link": "/users"
      },
      {
        "name": $localize`:Menu item:Reports`,
        "icon": "line-chart",
        "link": "/report"
      },
      {
        "name": $localize`:Menu item:Database Conflicts`,
        "icon": "wrench",
        "link": "/admin/conflicts"
      },
      {
        "name": $localize`:Menu item:Help`,
        "icon": "question-circle",
        "link": "/help"
      },
      {
        "name": $localize`:Menu item:Profile`,
        "icon": "user-circle-o",
        "link": "/user"
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
      "label": $localize`:Document status:OK (copy with us)`
    },
    {
      "id": "OK (copy needed for us)",
      "label": $localize`:Document status:OK (copy needed for us)`
    },
    {
      "id": "needs correction",
      "label": $localize`:Document status:needs correction`
    },
    {
      "id": "applied",
      "label": $localize`:Document status:applied`
    },
    {
      "id": "doesn't have",
      "label": $localize`:Document status:doesn't have`
    },
    {
      "id": "not eligible",
      "label": $localize`:Document status:not eligible`
    }
  ],
  "enum:center": [
    {
      "id": "alipore",
      "label": $localize`:center:Alipore`
    },
    {
      "id": "tollygunge",
      "label": $localize`:center:Tollygunge`
    },
    {
      "id": "barabazar",
      "label": $localize`:center:Barabazar`
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
                "label": $localize`:Dashboard shortcut widget|record attendance shortcut:Record Attendance`,
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
            "periodLabel": $localize`:Attendance week dashboard widget label:last week`
          }
        },
        {
          "component": "AttendanceWeekDashboard",
          "config": {
            "daysOffset": 7,
            "periodLabel": $localize`:Attendance week dashboard widget label:this week`
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
      "title": $localize`:Title for notes overview:Notes & Reports`,
      "includeEventNotes": false,
      "showEventNotesToggle": true,
      "columns": [
        {
          "id": "children",
          "noSorting": true
        }
      ],
      "columnGroups": {
        "default": $localize`:Translated name of default column group:Standard`,
        "mobile": $localize`:Translated name of mobile column group:Mobile`,
        "groups": [
          {
            "name": $localize`:Column group name:Standard`,
            "columns": [
              "date",
              "subject",
              "category",
              "authors",
              "children"
            ]
          },
          {
            "name": $localize`:Column group name:Mobile`,
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
    "permittedUserRoles": ["admin_app"]
  },
  "view:users": {
    "component": "UserList",
    "permittedUserRoles": ["admin_app"]
  },
  "view:admin/conflicts": {
    "component": "ConflictResolution",
    "permittedUserRoles": ["admin_app"],
    "lazyLoaded":  true
  },
  "view:help": {
    "component": "MarkdownPage",
    "config": {
      "markdownFile": $localize`:Filename of markdown help page (make sure the filename you enter as a translation actually exists on the server!):assets/help/help.en.md`,
    }
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
      "title": $localize`:Title of schools overview:Schools List`,
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
          "true": $localize`:Label for private schools filter - true case:Private School`,
          "false": $localize`:Label for private schools filter - false case:Government School`,
          "all": $localize`:Label for disabling the filter:All`
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
          "title": $localize`:Panel title:Basic Information`,
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
          "title": $localize`:Panel title:Students`,
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
      "title": $localize`:Title children overview:Children List`,
      "columns": [
        {
          "view": "ChildBlock",
          "label": $localize`:Column title for ChildBlockComponents:Name`,
          "id": "name"
        },
        {
          "view": "DisplayText",
          "label": $localize`:Column label for age of child:Age`,
          "id": "age"
        },
        {
          "view": "DisplayText",
          "label": $localize`:Column label for class which child attends:Class`,
          "id": "schoolClass"
        },
        {
          "view": "DisplayEntity",
          "label": $localize`:Column label for school which child attends:School`,
          "id": "schoolId",
          "additional": `${School.ENTITY_TYPE}`,
          "noSorting": true
        },
        {
          "view": "RecentAttendanceBlocks",
          "label": $localize`:Column label for school attendance of child:Attendance (School)`,
          "id": "schoolAttendance",
          "additional": {
            "filterByActivityType": "SCHOOL_CLASS"
          },
          "noSorting": true
        },
        {
          "view": "RecentAttendanceBlocks",
          "label": $localize`:Column label for coaching attendance of child:Attendance (Coaching)`,
          "id": "coachingAttendance",
          "additional": {
            "filterByActivityType": "COACHING_CLASS"
          },
          "noSorting": true
        },
        {
          "view": "BmiBlock",
          "label": $localize`:Column label for BMI of child:BMI`,
          "id": "health_BMI",
          "noSorting": true
        }
      ],
      "columnGroups": {
        "default": $localize`:Translated name of default column group:School Info`,
        "mobile": $localize`:Translated name of mobile column group:Mobile`,
        "groups": [
          {
            "name": $localize`:Column group name:Basic Info`,
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
            "name": $localize`:Column group name:School Info`,
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
            "name": $localize`:Column group name:Status`,
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
            "name": $localize`:Column group name:Health`,
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
            "name": $localize`:Column group name:Mobile`,
            "columns": [
              "projectNumber",
              "name",
              "age"
            ]
          }
        ]
      },
      "filters": [
        {
          "id": "isActive",
          "type": "boolean",
          "default": "true",
          "label": $localize`Children`,
          "true": $localize`:Active children filter label - true case:Active`,
          "false": $localize`:Active children filter label - false case:Inactive`,
          "all": $localize`:Active children unselect option:All`
        },
        {
          "id": "center",
          "display": "dropdown"
        },
        {
          "id": "schoolId",
          "type": "School",
          "label": $localize`:Label of schools filter:School`,
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
          "title": $localize`:Panel title:Basic Information`,
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
                ],
                "headers": [
                  null,
                  "Personal Information",
                  "Additional",
                  "Scholar activities",
                  null
                ]
              }
            }
          ]
        },
        {
          "title": $localize`:Panel title:Education`,
          "components": [
            {
              "title": $localize`:Title inside a panel:School History`,
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
              "title": $localize`:Title inside a panel:ASER Results`,
              "component": "Aser"
            }
          ]
        },
        {
          "title": $localize`:Panel title:Attendance`,
          "components": [
            {
              "title": "",
              "component": "GroupedChildAttendance"
            }
          ]
        },
        {
          "title": $localize`:Panel title:Notes & Reports`,
          "components": [
            {
              "title": "",
              "component": "NotesOfChild"
            }
          ]
        },
        {
          "title": $localize`:Panel title:Health`,
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
              "title": $localize`:Title inside a panel:Height & Weight Tracking`,
              "component": "HealthCheckup"
            }
          ]
        },
        {
          "title": $localize`:Panel title:Educational Materials`,
          "components": [
            {
              "title": "",
              "component": "EducationalMaterial"
            }
          ]
        },
        {
          title: $localize`:Panel title:Observations`,
          components: [
            {
              title: "",
              component: "HistoricalDataComponent",
              config: [
                "date",
                {id: "isMotivatedDuringClass", visibleFrom: "lg" },
                {id: "isParticipatingInClass", visibleFrom: "lg" },
                {id: "isInteractingWithOthers", visibleFrom: "lg" },
                {id: "doesHomework", visibleFrom: "lg" },
                {id: "isOnTime", visibleFrom: "lg" },
                {id: "asksQuestions", visibleFrom: "lg" },
                {id: "listens", visibleFrom: "lg" },
                {id: "canWorkOnBoard", visibleFrom: "lg" },
                {id: "isConcentrated", visibleFrom: "lg" },
                {id: "doesNotDisturb", visibleFrom: "lg" },
              ]
            }
          ]
        },
        {
          "title": $localize`:Panel title:Dropout`,
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
      "title": $localize`:Title of recurring activities overview:Recurring Activities`,
      "columns": [
        "title",
        "type",
        "assignedTo"
      ],
      "exportConfig": [
        { label: "Title", query: "title" },
        { label: "Type", query: "type" },
        { label: "Assigned users", query: "assignedTo" }
      ]
    }
  },
  "view:recurring-activity/:id": {
    "component": "EntityDetails",
    "config": {
      "entity": "RecurringActivity",
      "panels": [
        {
          "title": $localize`:Panel title:Activity`,
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
          "title": $localize`:Panel title:Participants`,
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
          "title": $localize`:Panel title:Events & Attendance`,
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
          "title": $localize`:Name of a report:Basic Report`,
          "aggregationDefinitions": [
            {
              "query": `${Child.ENTITY_TYPE}:toArray[*isActive=true]`,
              "label": $localize`:Label of report query:All children`,
              "aggregations": [
                {
                  "label": $localize`:Label of report query:Male children`,
                  "query": `:filterByObjectAttribute(gender, id, M)`
                },
                {
                  "label": $localize`:Label of report query:Female children`,
                  "query": `:filterByObjectAttribute(gender, id, F)`
                },
              ]
            },
            {
              "query": `${School.ENTITY_TYPE}:toArray`,
              "label": $localize`:Label for report query:All schools`,
              "aggregations": [
                {
                  "label": $localize`:Label for report query:Children attending a school`,
                  "query": `:getRelated(${ChildSchoolRelation.ENTITY_TYPE}, schoolId)[*isActive=true].childId:unique`
                },
                {
                  "label": $localize`:Label for report query:Governmental schools`,
                  "query": `[*privateSchool!=true]`
                },
                {
                  "query": `[*privateSchool!=true]:getRelated(${ChildSchoolRelation.ENTITY_TYPE}, schoolId)[*isActive=true].childId:addPrefix(${Child.ENTITY_TYPE}):unique:toEntities`,
                  "label": $localize`:Label for report query:Children attending a governmental school`,
                  "aggregations": [
                    {
                      "label": $localize`:Label for report query:Male children attending a governmental school`,
                      "query": `:filterByObjectAttribute(gender, id, M)`
                    },
                    {
                      "label": $localize`:Label for report query:Female children attending a governmental school`,
                      "query": `:filterByObjectAttribute(gender, id, F)`
                    },
                  ]
                },
                {
                  "label": $localize`:Label for report query:Private schools`,
                  "query": `[*privateSchool=true]`
                },
                {
                  "query": `[*privateSchool=true]:getRelated(${ChildSchoolRelation.ENTITY_TYPE}, schoolId)[*isActive=true].childId:addPrefix(${Child.ENTITY_TYPE}):unique:toEntities`,
                  "label": $localize`:Label for report query:Children attending a private school`,
                  "aggregations": [
                    {
                      "label": $localize`:Label for report query:Male children attending a private school`,
                      "query": `:filterByObjectAttribute(gender, id, M)`
                    },
                    {
                      "label": $localize`:Label for report query:Female children attending a private school`,
                      "query": `:filterByObjectAttribute(gender, id, F)`
                    },
                  ]
                },
              ]
            }
          ],
        },
        {
          "title": $localize`:Name of a report:Event Report`,
          "aggregationDefinitions": [
            {
              "query": `${EventNote.ENTITY_TYPE}:toArray[*date >= ? & date <= ?]`,
              "groupBy": ["category"],
              "label": $localize`:Label for a report query:Events`,
              "aggregations": [
                {
                  "query": `:getParticipantsWithAttendance(PRESENT):unique:addPrefix(${Child.ENTITY_TYPE}):toEntities`,
                  "groupBy": ["gender", "religion"],
                  "label": $localize`:Label for a report query:Participants`
                }
              ]
            }
          ],
        },
        {
          "title": $localize`:Name of a report:Overall Activity Report`,
          "aggregationDefinitions": [
            {
              "query": `${EventNote.ENTITY_TYPE}:toArray:addEntities(${Note.ENTITY_TYPE})[*date >= ? & date <= ?]`,
              "groupBy": ["category"],
              "label": $localize`:Label for a report query:Events`,
              "aggregations": [
                {
                  "query": `:getParticipantsWithAttendance(PRESENT):unique:addPrefix(${Child.ENTITY_TYPE}):toEntities`,
                  "groupBy": ["gender", "religion"],
                  "label": $localize`:Label for a report query:Participants`
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
        "schema": {
          dataType: "string",
          label: $localize`:Label for the address of a child:Address`
        }
      },
      {
        "name": "phone",
        "schema": {
          dataType: "string",
          label: $localize`:Label for phone number of a child:Phone No.`
        }
      },
      {
        "name": "guardianName",
        "schema": {
          dataType: "string",
          label: $localize`:Label for the guardians of a child:Guardians`
        }
      },
      {
        "name": "preferredTimeForGuardianMeeting",
        "schema": {
          dataType: "string",
          label: $localize`:Label for a child attribute:Preferred time for guardians meeting` }
      },
      {
        "name": "has_aadhar",
        "schema": {
          dataType: "configurable-enum",
          innerDataType: "document-status",
          label: $localize`:Label for a child attribute:Aadhar`
        }
      },
      {
        "name": "has_bankAccount",
        "schema": {
          dataType: "configurable-enum",
          innerDataType: "document-status",
          label: $localize`:Label for a child attribute:Bank Account`
        }
      },
      {
        "name": "has_kanyashree",
        "schema": {
          dataType: "configurable-enum",
          innerDataType: "document-status",
          label: $localize`:Label for a child attribute:Kanyashree`
        }
      },
      {
        "name": "has_rationCard",
        "schema": {
          dataType: "configurable-enum",
          innerDataType: "document-status",
          label: $localize`:Label for a child attribute:Ration Card`
        }
      },
      {
        "name": "has_BplCard",
        "schema": {
          dataType: "configurable-enum",
          innerDataType: "document-status",
          label: $localize`:Label for a child attribute:BPL Card`
        }
      },
      {
        "name": "health_bloodGroup",
        "schema": {
          dataType: "string",
          label: $localize`:Label for a child attribute:Blood Group`
        }
      },
      {
        "name": "health_lastDentalCheckup",
        "schema": {
          dataType: "Date",
          label: $localize`:Label for a child attribute:Last Dental Check-Up`
        }
      },
      {
        "name": "health_lastDeworming",
        "schema": {
          dataType: "Date",
          label: $localize`:Label for a child attribute:Last De-Worming`
        }
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
          label: $localize`:Label for a child attribute:Motivated`,
          description: $localize`:Description for a child attribute:The child is motivated during the class.`
        }
      },
      {
        "name": "isParticipatingInClass",
        "schema": {
          "dataType": "configurable-enum",
          "innerDataType": "rating-answer",
          label: $localize`:Label for a child attribute:Participates`,
          description: $localize`:Description for a child attribute:The child is actively participating in the class.`
        }
      },
      {
        "name": "isInteractingWithOthers",
        "schema": {
          "dataType": "configurable-enum",
          "innerDataType": "rating-answer",
          label: $localize`:Label for a child attribute:Interacts`,
          description: $localize`:Description for a child attribute:The child interacts with other students during the class.`
        }
      },
      {
        "name": "doesHomework",
        "schema": {
          "dataType": "configurable-enum",
          "innerDataType": "rating-answer",
          label: $localize`:Label for a child attribute:Homework`,
          description: $localize`:Description for a child attribute:The child does its homework.`
        }
      },
      {
        "name": "isOnTime",
        "schema": {
          "dataType": "configurable-enum",
          "innerDataType": "rating-answer",
          label: $localize`:Label for a child attribute:On time`,
          description: $localize`:Description for a child attribute:The child is always on time for the class.`
        }
      },
      {
        "name": "asksQuestions",
        "schema": {
          "dataType": "configurable-enum",
          "innerDataType": "rating-answer",
          label: $localize`:Label for a child attribute:Asks`,
          description: $localize`:Description for a child attribute:The child is asking questions during the class.`
        }
      },
      {
        "name": "listens",
        "schema": {
          "dataType": "configurable-enum",
          "innerDataType": "rating-answer",
          label: $localize`:Label for a child attribute:Listens`,
          description: $localize`:Description for a child attribute:The child is listening during the class.`
        }
      },
      {
        "name": "canWorkOnBoard",
        "schema": {
          "dataType": "configurable-enum",
          "innerDataType": "rating-answer",
          label: $localize`:Label for a child attribute:Solves on board`,
          description: $localize`:Description for a child attribute:The child can solve exercises on the board.`
        }
      },
      {
        "name": "isConcentrated",
        "schema": {
          "dataType": "configurable-enum",
          "innerDataType": "rating-answer",
          label: $localize`:Label for a child attribute:Concentrated`,
          description: $localize`:Description for a child attribute:The child is concentrated during the class.`
        }
      },
      {
        "name": "doesNotDisturb",
        "schema": {
          "dataType": "configurable-enum",
          "innerDataType": "rating-answer",
          label: $localize`:Label for a child attribute:Not disturbing`,
          description: $localize`:Description for a child attribute:The child does not disturb the class.`
        }
      },
    ]
  },
  "entity:Note": {
    permissions: {
    }
  },
  "entity:EventNote": {
    permission: {
    }
  }
}
