import { Child } from "../../child-dev-project/children/model/child";
import { School } from "../../child-dev-project/schools/model/school";
import { ChildSchoolRelation } from "../../child-dev-project/children/model/childSchoolRelation";
import { defaultDateFilters } from "../basic-datatypes/date/date-range-filter/date-range-filter-panel/date-range-filter-panel.component";
import { EducationalMaterial } from "../../child-dev-project/children/educational-material/model/educational-material";

// prettier-ignore
export const defaultJsonConfig = {
  "appConfig:usage-analytics": {
    "url": "https://matomo.aam-digital.org",
    "site_id": "8",
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
        "name": $localize`:Menu item:Attendance`,
        "icon": "calendar-check",
        "link": "/attendance"
      },
      {
        "name": $localize`:Menu item:Notes`,
        "icon": "file-alt",
        "link": "/note"
      },
      {
        "name": $localize`:Menu item:Tasks`,
        "icon": "tasks",
        "link": "/todo"
      },
      {
        "name": $localize`:Menu item:Import`,
        "icon": "file-import",
        "link": "/import"
      },
      {
        "name": $localize`:Menu item:Users`,
        "icon": "users",
        "link": "/user"
      },
      {
        "name": $localize`:Menu item:Reports`,
        "icon": "line-chart",
        "link": "/report"
      },
      {
        "name": $localize`:Menu item:Help`,
        "icon": "question",
        "link": "/help"
      },
      {
        "name": $localize`:Menu item:Admin`,
        "icon": "wrench",
        "link": "/admin"
      },
    ]
  },
  "view:": {
    "component": "Dashboard",
    "config": {
      "widgets": [
        {
          "component": "ShortcutDashboard",
          "config": {
            "shortcuts": [
              {
                "label": $localize`:Dashboard shortcut widget|record attendance shortcut:Record Attendance`,
                "icon": "calendar-check",
                "link": "/attendance/add-day",
              },
              {
                "label": $localize`:Dashboard shortcut widget|record attendance shortcut:Add Child`,
                "icon": "plus",
                "link": "/child/new",
              },
              {
                "label": $localize`:Dashboard shortcut widget|open public form:Public Registration Form`,
                "icon": "file-circle-check",
                "link": "/public-form/test",
              }
            ]
          }
        },
        {
          "component": "EntityCountDashboard"
        },
        {
          "component": "ImportantNotesDashboard",
          "config": {
            "warningLevels": ["WARNING", "URGENT"],
          }
        },
        {
          "component": "TodosDashboard",
          "config": {}
        },
        {
          "component": "NotesDashboard",
          "config": {
            "sinceDays": 28,
            "fromBeginningOfWeek": false,
            "mode": "with-recent-notes"
          }
        },
        {
          "component": "NotesDashboard",
          "config": {
            "sinceDays": 28,
            "fromBeginningOfWeek": false,
            "mode": "without-recent-notes"
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
          "component": "AttendanceWeekDashboard",
          "config": {
            "daysOffset": 0,
            "periodLabel": $localize`:Attendance week dashboard widget label:last week`
          }
        },
        {
          "component": "AttendanceWeekDashboard",
          "config": {
            "daysOffset": 0,
            "label": $localize`:Attendance week dashboard widget label:Late last week`,
            "attendanceStatusType": "LATE"
          }
        },
        {
          "component": "ProgressDashboard",
          "config": {
            "dashboardConfigId": "1"
          }
        },
        {
          "component": "BirthdayDashboard"
        },
        {
          "component": "ChildrenBmiDashboard"
        },
      ]
    }
  },
  "view:note": {
    "component": "NotesManager",
    "config": {
      "entity": "Note",
      "title": $localize`:Title for notes overview:Notes & Reports`,
      "includeEventNotes": false,
      "showEventNotesToggle": true,
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
          "label": $localize`:Filter label:Status`,
          "type": "prebuilt"
        },
        {
          "id": "date",
          "default": 1,
          "options": defaultDateFilters
        },
        {
          "id": "category"
        },
        { "id": "authors" },
      ],
      "exportConfig": [
        {"label": "event_id", "query": "_id"},
        {"label": "date", "query": "date"},
        {"label": "event title", "query": "subject"},
        {"label": "event type", "query": "category"},
        {"label": "event description", "query": "text"},
        {
          "query": ":getAttendanceArray(true)",
          "subQueries": [
            {
              "query": ".participant:toEntities(Child)",
              "subQueries": [
                {"label": "participant_id", "query": "_id"},
                {"label": "participant", "query": "name"},
                {"label": "gender", "query": "gender"},
                {"label": "religion", "query": "religion"},
              ]
            },
            {
              "label": "status",
              "query": ".status._status.id",
            },
            {
              "query": ".school:toEntities(School)",
              "subQueries": [
                {"label": "school_name", "query": "name"},
                {"label": "school_id", "query": "entityId"}
              ]
            }
          ],
        },
      ]
    }
  },
  "view:import": {
    "component": "Import",
  },
  "view:user": {
    "component": "EntityList",
    "config": {
      "entity": "User",
      "columns": ["name", "phone"]
    },
    "permittedUserRoles": ["admin_app"]
  },
  "view:user/:id": {
    "component": "EntityDetails",
    "config": {
      "entity": "User",
      "panels": [
        {
          "title": $localize`:Panel title:User Information`,
          "components": [
            {
              "title": "",
              "component": "Form",
              "config": {
                "fieldGroups": [
                  { "fields": ["name"] },
                  { "fields": ["phone"] },
                ],
              }
            }
          ]
        },
        {
          "title": $localize`:Panel title:Security`,
          "components": [
            {
              "component": "UserSecurity"
            }
          ]
        }
      ],
    },
    "permittedUserRoles": ["admin_app"]
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
  "view:attendance/add-day": {
    "component": "AddDayAttendance"
  },
  "view:school": {
    "component": "EntityList",
    "config": {
      "entity": "School",
      "columns": [
        "name",
        { id: "DisplayParticipantsCount", viewComponent: "DisplayParticipantsCount", label: $localize`Children` },
        "privateSchool",
        "language"
      ],
      "filters": [
        {
          "id": "privateSchool",
          "label": $localize`Private School`
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
                "fieldGroups": [
                  { "fields": ["name", "privateSchool"] },
                  { "fields": ["address", "phone"] },
                  { "fields": ["language", "timing"] },
                  { "fields": ["remarks"] }
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
              "component": "ChildSchoolOverview",
            }
          ]
        },
        {
          "title": $localize`:Panel title:Activities`,
          "components": [
            {
              "title": "",
              "component": "ActivitiesOverview",
            }
          ]
        }
      ],
    }
  },
  "view:child": {
    "component": "ChildrenList",
    "config": {
      "entity": "Child",
      "columns": [
        {
          "viewComponent": "ChildBlock",
          "label": $localize`:Column title for ChildBlockComponents:Name`,
          "id": "name"
        },
        {
          "viewComponent": "DisplayAge",
          "label": $localize`:Column label for age of child:Age`,
          "id": "age",
          "additional": "dateOfBirth"
        },
        {
          "viewComponent": "DisplayText",
          "label": $localize`:Column label for class which child attends:Class`,
          "id": "schoolClass"
        },
        {
          "viewComponent": "DisplayEntityArray",
          "label": $localize`:Column label for school which child attends:School`,
          "id": "schoolId",
          "additional": `${School.ENTITY_TYPE}`,
          "noSorting": true
        },
        {
          "viewComponent": "RecentAttendanceBlocks",
          "label": $localize`:Column label for school attendance of child:Attendance (School)`,
          "id": "schoolAttendance",
          "additional": {
            "filterByActivityType": "SCHOOL_CLASS"
          },
          "noSorting": true
        },
        {
          "viewComponent": "RecentAttendanceBlocks",
          "label": $localize`:Column label for coaching attendance of child:Attendance (Coaching)`,
          "id": "coachingAttendance",
          "additional": {
            "filterByActivityType": "COACHING_CLASS"
          },
          "noSorting": true
        },
        {
          "viewComponent": "BmiBlock",
          "label": $localize`:Column label for BMI of child:BMI`,
          "id": "health_BMI",
          "noSorting": true
        }
      ],
      "columnGroups": {
        "default": $localize`:Translated name of default column group:Basic Info`,
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
              "admissionDate"
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
              "gender",
              "age",
              "dateOfBirth",
              "birth_certificate"
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
          "id": "center"
        },
        {
          "id": "schoolId",
          "type": "School",
          "label": $localize`:Label of schools filter:School`
        }
      ],
      "exportConfig": [
        { "label": "Name", "query": "name" },
        { "label": "Gender", "query": "gender" },
        { "label": "Date of Birth", "query": "dateOfBirth" },
        { "label": "School", "query": ".schoolId:toEntities(School).name" },
        { "label": "more fields can be configured - or all data exported", "query": "projectNumber" }
      ]
    }
  },
  "view:child/:id": {
    "component": "EntityDetails",
    "config": {
      "entity": "Child",
      "panels": [
        {
          "title": $localize`:Panel title:Basic Information`,
          "components": [
            {
              "title": "",
              "component": "Form",
              "config": {
                "fieldGroups": [
                  { "fields": ["photo"] },
                  {
                    "fields": ["name", "projectNumber", "admissionDate"],
                    "header": $localize`:Header for form section:Personal Information`
                  },
                  {
                    "fields": ["dateOfBirth", "birth_certificate", "gender", "motherTongue"],
                    "header": $localize`:Header for form section:Additional`
                  },
                  {
                    "fields": ["center", "status", "address", "phone"],
                    "header": $localize`:Header for form section:Scholar activities`
                  }
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
              "component": "ChildSchoolOverview",
              "config": {
                "single": true,
                "columns": [
                  {
                    "id": "start",
                    "visibleFrom": "sm",
                  },
                  {
                    "id": "end",
                    "visibleFrom": "sm",
                  },
                  "schoolId",
                  "schoolClass",
                  "result",
                ],
              }
            },
            {
              "title": $localize`:Title inside a panel:ASER Results`,
              "component": "Aser"
            },
            {
              "title": $localize`:Child details section title:Find a suitable new school`,
              "component": "MatchingEntities",
              "config": {
                "rightSide": {
                  "entityType": School.ENTITY_TYPE,
                  "availableFilters": [{"id": "language"}],
                },
              }
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
          "title": $localize`:Panel title:Notes & Tasks`,
          "components": [
            {
              "title": "",
              "component": "NotesRelatedToEntity"
            },
            {
              "title": "Tasks",
              "component": "TodosRelatedToEntity"
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
                "fieldGroups": [
                  { "fields": ["health_bloodGroup"] },
                  {
                    "fields": [
                      { "id": "_description_health", "editComponent": "EditDescriptionOnly", "label": $localize`:description section:Health checkups are to be done regularly, at least every 6 months according to the program guidelines.`},
                      "health_lastDentalCheckup"
                    ]
                  }
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
              "component": "RelatedEntitiesWithSummary",
              "config": {
                "entityType": EducationalMaterial.ENTITY_TYPE,
                "property": "child",
                "columns": [
                  { "id": "date", "visibleFrom": "xs" },
                  { "id": "materialType", "visibleFrom": "xs" },
                  { "id": "materialAmount", "visibleFrom": "md" },
                  { "id": "description", "visibleFrom": "md" },
                ],
                "summaries": {
                  "countProperty": "materialAmount",
                  "groupBy": "materialType",
                  "total": true,
                  "average": false
                }
              }
            }
          ]
        },
        {
          "title": $localize`:Panel title:Observations`,
          "components": [
            {
              "title": "",
              "component": "HistoricalDataComponent",
              "config": [
                "date",
                { "id": "isMotivatedDuringClass", "visibleFrom": "lg" },
                { "id": "isParticipatingInClass", "visibleFrom": "lg" },
                { "id": "isInteractingWithOthers", "visibleFrom": "lg" },
                { "id": "doesHomework", "visibleFrom": "lg" },
                { "id": "asksQuestions", "visibleFrom": "lg" },
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
                "fieldGroups": [
                  { "fields": ["dropoutDate"] },
                  { "fields": ["dropoutType"] },
                  { "fields": ["dropoutRemarks"] }
                ]
              }
            }
          ]
        }
      ]
    }
  },
  "view:attendance/recurring-activity": {
    "component": "EntityList",
    "config": {
      "entity": "RecurringActivity",
      "columns": [
        "title",
        "type",
        "assignedTo"
      ],
      "exportConfig": [
        { "label": "Title", "query": "title" },
        { "label": "Type", "query": "type" },
        { "label": "Assigned users", "query": "assignedTo" }
      ]
    }
  },
  "view:attendance/recurring-activity/:id": {
    "component": "EntityDetails",
    "config": {
      "entity": "RecurringActivity",
      "panels": [
        {
          "title": $localize`:Panel title:Basic Information`,
          "components": [
            {
              "component": "Form",
              "config": {
                "fieldGroups": [
                  { "fields": ["title"] },
                  { "fields": ["type", "inactive"] },
                  { "fields": ["assignedTo"] }
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
                "fieldGroups": [
                  { "fields": ["linkedGroups", "participants", "excludedParticipants"] }
                ]
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
    }
  },
  "view:report": {
    "component": "Reporting",
  },

  "entity:Child": {
    "label": $localize`:Label for child:Child`,
    "labelPlural": $localize`:Plural label for child:Children`,

    "attributes": {
      "address": {
        "dataType": "location",
        "label": $localize`:Label for the address of a child:Address`
      },
      "health_bloodGroup": {
        "dataType": "string",
        "label": $localize`:Label for a child attribute:Blood Group`
      },
      "religion": {
        "dataType": "string",
        "label": $localize`:Label for the religion of a child:Religion`
      },
      "motherTongue": {
        "dataType": "string",
        "label": $localize`:Label for the mother tongue of a child:Mother Tongue`,
        description: $localize`:Tooltip description for the mother tongue of a child:The primary language spoken at home`,
      },
      "health_lastDentalCheckup": {
        "dataType": "date",
        "label": $localize`:Label for a child attribute:Last Dental Check-Up`
      },
      "birth_certificate": {
        "dataType": "file",
        "label": $localize`:Label for a child attribute:Birth certificate`
      }
    },
  },
  "entity:School": {
    "attributes": {
      "name": {
        "dataType": "string",
        "label": $localize`:Label for the name of a school:Name`
      },
      "privateSchool": {
        "dataType": "boolean",
        "label": $localize`:Label for if a school is a private school:Private School`
      },
      "language": {
        "dataType": "string",
        "label": $localize`:Label for the language of a school:Language`
      },
      "address": {
        "dataType": "location",
        "label": $localize`:Label for the address of a school:Address`
      },
      "phone": {
        "dataType": "string",
        "label": $localize`:Label for the phone number of a school:Phone Number`
      },
      "timing": {
        "dataType": "string",
        "label": $localize`:Label for the timing of a school:School Timing`
      },
      "remarks": {
        "dataType": "string",
        "label": $localize`:Label for the remarks for a school:Remarks`
      }
    },
  },
  "entity:HistoricalEntityData": {
    "attributes": {
      "isMotivatedDuringClass": {
        "dataType": "configurable-enum",
        "additional": "rating-answer",
        "label": $localize`:Label for a child attribute:Motivated`,
        description: $localize`:Description for a child attribute:The child is motivated during the class.`
      },
      "isParticipatingInClass": {
        "dataType": "configurable-enum",
        "additional": "rating-answer",
        "label": $localize`:Label for a child attribute:Participating`,
        description: $localize`:Description for a child attribute:The child is actively participating in the class.`
      },
      "isInteractingWithOthers": {
        "dataType": "configurable-enum",
        "additional": "rating-answer",
        "label": $localize`:Label for a child attribute:Interacting`,
        description: $localize`:Description for a child attribute:The child interacts with other students during the class.`
      },
      "doesHomework": {
        "dataType": "configurable-enum",
        "additional": "rating-answer",
        "label": $localize`:Label for a child attribute:Homework`,
        description: $localize`:Description for a child attribute:The child does its homework.`
      },
      "asksQuestions": {
        "dataType": "configurable-enum",
        "additional": "rating-answer",
        "label": $localize`:Label for a child attribute:Asking Questions`,
        description: $localize`:Description for a child attribute:The child is asking questions during the class.`
      },
    }
  },
  "entity:User": {
    "attributes": {
      "phone": {
        "dataType": "string",
        "label": $localize`:Label of user phone:Contact`
      }
    },
  },
  "view:matching": {
    "component": "MatchingEntities",
    "config": {
      "rightSide": {
        "entityType": School.ENTITY_TYPE,
        "prefilter": { "privateSchool": true },
        "availableFilters": [{"id": "language"}],
      },
      "leftSide": { "entityType": Child.ENTITY_TYPE },
    }
  },
  "appConfig:matching-entities": {
    "columns": [
      ["name", "name"],
      ["motherTongue", "language"],
      ["address", "address"],
      ["distance", "privateSchool"],
    ],
    "onMatch": {
      "newEntityType": ChildSchoolRelation.ENTITY_TYPE,
      "newEntityMatchPropertyLeft": "childId",
      "newEntityMatchPropertyRight": "schoolId",
      "columnsToReview": ["start", "end", "result", "childId", "schoolId"]
    }
  },

  "entity:Todo": {
    "attributes": {}
  },
  "view:todo": {
    "component": "TodoList",
    "config": {
      "entity": "Todo",
      "columns": ["deadline", "subject", "assignedTo", "startDate", "relatedEntities"],
      "filters": [
        {"id": "assignedTo"},

        {
          "id": "due-status",
          "type": "prebuilt"
        }
      ]
    }
  }
};
