import { ChildSchoolRelation } from "../../child-dev-project/children/model/childSchoolRelation";
import { defaultDateFilters } from "../basic-datatypes/date/date-range-filter/date-range-filter-panel/date-range-filter-panel.component";
import { todoDefaultConfigs } from "../../features/todos/model/todo-default-configs";
import { EntityDatatype } from "../basic-datatypes/entity/entity.datatype";
import { PLACEHOLDERS } from "../entity/schema/entity-schema-field";
import { INTERACTION_TYPE_CONFIG_ID } from "../../child-dev-project/notes/model/interaction-type.interface";
import { EventAttendanceMap } from "../../child-dev-project/attendance/model/event-attendance";
import { LongTextDatatype } from "../basic-datatypes/string/long-text.datatype";
import { RecurringActivity } from "../../child-dev-project/attendance/model/recurring-activity";

// prettier-ignore
export const defaultJsonConfig = {
  "appConfig:usage-analytics": {
    "url": "https://matomo.aam-digital.org",
    "site_id": "8",
  },
  "navigationMenu": {
    "items": [
      {
        "label": $localize`:Menu item:Dashboard`,
        "icon": "home",
        "link": "/"
      },
      {
        "label": $localize`:Menu item:Children`,
        "icon": "child",
        "link": "/child"
      },
      {
        "label": $localize`:Menu item:Schools`,
        "icon": "university",
        "link": "/school"
      },
      {
        "label": $localize`:Menu item:Attendance`,
        "icon": "calendar-check",
        "link": "/attendance"
      },
      {
        "label": $localize`:Menu item:Notes`,
        "icon": "file-alt",
        "link": "/note"
      },
      {
        "label": $localize`:Menu item:Tasks`,
        "icon": "tasks",
        "link": "/todo"
      },
      {
        "label": $localize`:Menu item:Import`,
        "icon": "file-import",
        "link": "/import"
      },
      {
        "label": $localize`:Menu item:Users`,
        "icon": "users",
        "link": "/user"
      },
      {
        "label": $localize`:Menu item:Reports`,
        "icon": "line-chart",
        "link": "/report"
      },
      {
        "label": $localize`:Menu item:Help`,
        "icon": "question",
        "link": "/help"
      },
      {
        "label": $localize`:Menu item:Admin`,
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
      ]
    }
  },
  "entity:Note": {
    toStringAttributes: ["subject"],
    label: $localize`:label for entity:Note`,
    labelPlural: $localize`:label (plural) for entity:Notes`,
    hasPII: true,
    attributes: {
      children: {
        label: $localize`:Label for the children of a note:Children`,
        dataType: "entity",
        isArray: true,
        additional: "Child",
        entityReferenceRole: "composite",
        editComponent: "EditAttendance",
        anonymize: "retain",
      },
      childrenAttendance: {
        dataType: EventAttendanceMap.DATA_TYPE,
        anonymize: "retain"
      },
      date: {
        label: $localize`:Label for the date of a note:Date`,
        dataType: "date-only",
        defaultValue: {
          mode: "dynamic",
          value: PLACEHOLDERS.NOW,
        },
        anonymize: "retain",
      },
      subject: {
        dataType: "string",
        label: $localize`:Label for the subject of a note:Subject`
      },
      text: {
        dataType: LongTextDatatype.dataType,
        label: $localize`:Label for the actual notes of a note:Notes`,
      },
      authors: {
        label: $localize`:Label for the social worker(s) who created the note:SW`,
        dataType: "entity",
        isArray: true,
        additional: "User",
        defaultValue: {
          mode: "dynamic",
          value: PLACEHOLDERS.CURRENT_USER,
        },
        anonymize: "retain",
      },
      category: {
        label: $localize`:Label for the category of a note:Category`,
        dataType: "configurable-enum",
        additional: INTERACTION_TYPE_CONFIG_ID,
        anonymize: "retain",
      },
      attachment: {
        label: $localize`Attachment`,
        dataType: "file",
      },
      relatesTo: {
        dataType: "entity",
        additional: RecurringActivity.ENTITY_TYPE,
        anonymize: "retain",
      },
      relatedEntities: {
        label: $localize`:label for the related Entities:Related Records`,
        dataType: "entity",
        isArray: true,
        // by default no additional relatedEntities can be linked apart from children and schools, overwrite this in config to display (e.g. additional: "ChildSchoolRelation")
        additional: undefined,
        anonymize: "retain",
      },
      schools: {
        label: $localize`:label for the linked schools:Groups`,
        dataType: "entity",
        isArray: true,
        additional: "School",
        entityReferenceRole: "composite",
        anonymize: "retain",
      },
      warningLevel: {
        label: $localize`:Status of a note:Status`,
        dataType: "configurable-enum",
        additional: "warning-levels",
        anonymize: "retain",
      },
    }
  },
  "view:note": {
    "component": "NotesManager",
    "config": {
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
          "id": "warningLevel"
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
  "view:note/:id": {
    "component": "NoteDetails",
    "config": {
      "topForm": ["date", "warningLevel", "category", "authors", "attachment"]
    }
  },
  "view:import": {
    "component": "Import",
  },
  "view:user": {
    "component": "EntityList",
    "config": {
      "entityType": "User",
      "columns": ["name", "phone"]
    },
    "permittedUserRoles": ["admin_app"]
  },
  "view:user/:id": {
    "component": "EntityDetails",
    "config": {
      "entityType": "User",
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
    }
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
      "entityType": "School",
      "columns": [
        "name",
        { id: "DisplayParticipantsCount", viewComponent: "DisplayParticipantsCount", label: $localize`Children` },
        "privateSchool",
        "language"
      ],
      "filters": [
        { "id": "privateSchool" }
      ]
    }
  },
  "view:school/:id": {
    "component": "EntityDetails",
    "config": {
      "entityType": "School",
      "panels": [
        {
          "title": $localize`:Panel title:Basic Information`,
          "components": [
            {
              "title": "",
              "component": "Form",
              "config": {
                "fieldGroups": [
                  { "fields": ["name", "privateSchool", "parentSchool"] },
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
      "entityType": "Child",
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
          "viewComponent": "DisplayEntity",
          "label": $localize`:Column label for school which child attends:School`,
          "id": "schoolId",
          "additional": "School",
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
      "entityType": "Child",
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
              "component": "RelatedEntities",
              "config": {
                "entityType": "Aser",
                "property": "child",
                "columns": [
                  {
                    "id": "date",
                    "visibleFrom": "xs"
                  },
                  {
                    "id": "math",
                    "visibleFrom": "xs"
                  },
                  {
                    "id": "english",
                    "visibleFrom": "xs"
                  },
                  {
                    "id": "hindi",
                    "visibleFrom": "md"
                  },
                  {
                    "id": "bengali",
                    "visibleFrom": "md"
                  },
                  {
                    "id": "remarks",
                    "visibleFrom": "md"
                  }
                ]
              }
            },
            {
              "title": $localize`:Child details section title:Find a suitable new school`,
              "component": "MatchingEntities",
              "config": {
                "rightSide": {
                  "entityType": "School",
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
              "component": "RelatedEntities",
              "config": {
                "entityType": "HealthCheck",
                "property": "child",
                "columns": [
                  { "id": "date" },
                  { "id": "height" },
                  { "id": "weight" },
                  {
                    "id": "bmi",
                    "label": $localize`:Table header, Short for Body Mass Index:BMI`,
                    "description": $localize`:Tooltip for BMI info:This is calculated using the height and the weight measure`,
                    "viewComponent": "DisplayCalculatedValue",
                    "additional": {
                      "calculation": "bmi",
                      "valueFields": ["weight", "height"],
                      "decimalPlaces": 1
                    }
                  }
                ]
              }
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
                "entityType": "EducationalMaterial",
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
              "config": {
                "columns": [
                  "date",
                  { "id": "isMotivatedDuringClass", "visibleFrom": "lg" },
                  { "id": "isParticipatingInClass", "visibleFrom": "lg" },
                  { "id": "isInteractingWithOthers", "visibleFrom": "lg" },
                  { "id": "doesHomework", "visibleFrom": "lg" },
                  { "id": "asksQuestions", "visibleFrom": "lg" },
                ]
              }
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
  "entity:EducationMaterial": {
    attributes: {
      child: {
        dataType: EntityDatatype.dataType,
        additional: "Child",
        entityReferenceRole: "composite",
      },
      date: {
        dataType: "date",
        label: $localize`:Date on which the material has been borrowed:Date`,
        defaultValue: {
          mode: "dynamic",
          value: PLACEHOLDERS.NOW,
        },
      },
      materialType: {
        label: $localize`:The material which has been borrowed:Material`,
        dataType: "configurable-enum",
        additional: "materials",
        validators: {
          required: true,
        },
      },
      materialAmount: {
        dataType: "number",
        label: $localize`:The amount of the material which has been borrowed:Amount`,
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
        label: $localize`:An additional description for the borrowed material:Description`,
      }
    }
  },
  "entity:RecurringActivity": {
    toStringAttributes: ["title"],
    label: $localize`:label for entity:Recurring Activity`,
    labelPlural: $localize`:label (plural) for entity:Recurring Activities`,
    color: "#00838F",
    route: "attendance/recurring-activity",
    attributes: {
      title: {
        dataType: "string",
        label: $localize`:Label for the title of a recurring activity:Title`,
        validators: {
          required: true,
        },
      },
      type: {
        label: $localize`:Label for the interaction type of a recurring activity:Type`,
        dataType: "configurable-enum",
        additional: INTERACTION_TYPE_CONFIG_ID,
      },
      participants: {
        label: $localize`:Label for the participants of a recurring activity:Participants`,
        dataType: "entity",
        isArray: true,
        additional: "Child",
      },
      linkedGroups: {
        label: $localize`:Label for the linked schools of a recurring activity:Groups`,
        dataType: "entity",
        isArray: true,
        additional: "School",
      },
      excludedParticipants: {
        label: $localize`:Label for excluded participants of a recurring activity:Excluded Participants`,
        dataType: "entity",
        isArray: true,
        additional: "Child",
      },
      assignedTo: {
        label: $localize`:Label for the assigned user(s) of a recurring activity:Assigned user(s)`,
        dataType: "entity",
        isArray: true,
        additional: "User",
      }
    }
  },
  "view:attendance/recurring-activity": {
    "component": "EntityList",
    "config": {
      "entityType": "RecurringActivity",
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
      "entityType": "RecurringActivity",
      "panels": [
        {
          "title": $localize`:Panel title:Basic Information`,
          "components": [
            {
              "component": "Form",
              "config": {
                "fieldGroups": [
                  { "fields": ["title"] },
                  { "fields": ["type"] },
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
    "toStringAttributes": ["name"],
    "icon": "child",
    "color": "#1565C0",
    "blockComponent": "ChildBlock",
    "hasPII": true,

    "attributes": {
      name: {
        dataType: "string",
        label: $localize`:Label for the name of a child:Name`,
        validators: {
          required: true,
        },
      },
      projectNumber: {
        dataType: "string",
        label: $localize`:Label for the project number of a child:Project Number`,
        labelShort: $localize`:Short label for the project number:PN`,
        searchable: true,
        anonymize: "retain",
      },
      dateOfBirth: {
        dataType: "date-with-age",
        label: $localize`:Label for the date of birth of a child:Date of birth`,
        labelShort: $localize`:Short label for the date of birth:DoB`,
        anonymize: "retain-anonymized",
      },
      center: {
        dataType: "configurable-enum",
        additional: "center",
        label: $localize`:Label for the center of a child:Center`,
        anonymize: "retain",
      },
      gender: {
        dataType: "configurable-enum",
        label: $localize`:Label for the gender of a child:Gender`,
        additional: "genders",
        anonymize: "retain",
      },
      admissionDate: {
        dataType: "date-only",
        label: $localize`:Label for the admission date of a child:Admission`,
        anonymize: "retain-anonymized",
      },
      status: {
        dataType: "string",
        label: $localize`:Label for the status of a child:Status`,
      },
      dropoutDate: {
        dataType: "date-only",
        label: $localize`:Label for the dropout date of a child:Dropout Date`,
        anonymize: "retain-anonymized",
      },
      dropoutType: {
        dataType: "string",
        label: $localize`:Label for the type of dropout of a child:Dropout Type`,
        anonymize: "retain",
      },
      dropoutRemarks: {
        dataType: "string",
        label: $localize`:Label for the remarks about a dropout of a child:Dropout remarks`,
      },
      photo: {
        dataType: "photo",
        label: $localize`:Label for the file field of a photo of a child:Photo`,
      },
      phone: {
        dataType: "string",
        label: $localize`:Label for the phone number of a child:Phone Number`,
      },
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
    "toStringAttributes": ["name"],
    "icon": "university",
    "label": $localize`:label for entity:School`,
    "labelPlural": $localize`:label (plural) for entity:Schools`,
    "color": "#9E9D24",
    "attributes": {
      "name": {
        "dataType": "string",
        "label": $localize`:Label for the name of a school:Name`,
        "validators": {
          required: true,
        },
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
    hasPII: true,
    "attributes": {
      date: {
        dataType: "date",
        label: $localize`:Label for date of historical data:Date`,
        defaultValue: {
          mode: "dynamic",
          value: PLACEHOLDERS.NOW,
        },
        anonymize: "retain-anonymized",
      },
      relatedEntity: {
        dataType: "entity",
        additional: "Child",
        entityReferenceRole: "composite",
        anonymize: "retain",
      },
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
    "toStringAttributes": ["name"],
    "icon": "user",
    "label": $localize`:label for entity:User`,
    "labelPlural": $localize`:label (plural) for entity:Users`,
    "hasPII": true,

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
        "entityType": "School",
        "prefilter": {"privateSchool": true},
        "availableFilters": [{"id": "language"}],
      },
      "leftSide": {"entityType": "Child"},
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
  "entity:Aser": {
    hasPII: true,
    attributes: {
      child: {
        dataType: "entity",
        additional: "Child",
        entityReferenceRole: "composite",
      },

      date: {
        dataType: "date",
        label: $localize`:Label for date of the ASER results:Date`,
        defaultValue: {
          mode: "dynamic",
          value: PLACEHOLDERS.NOW,
        },
        anonymize: "retain-anonymized",
      },

      hindi: {
        label: $localize`:Label of the Hindi ASER result:Hindi`,
        dataType: "configurable-enum",
        additional: "reading-levels",
      },
      bengali: {
        label: $localize`:Label of the Bengali ASER result:Bengali`,
        dataType: "configurable-enum",
        additional: "reading-levels",
      },
      english: {
        label: $localize`:Label of the English ASER result:English`,
        dataType: "configurable-enum",
        additional: "reading-levels",
      },
      math: {
        label: $localize`:Label of the Math ASER result:Math`,
        dataType: "configurable-enum",
        additional: "math-levels",
      },

      remarks: {
        dataType: "string",
        label: $localize`:Label for the remarks of a ASER result:Remarks`,
      },
    }
  },
  "entity:HealthCheck": {
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
        label: $localize`:Label for date of a health check:Date`,
        anonymize: "retain-anonymized",
        defaultValue: {
          mode: "dynamic",
          value: PLACEHOLDERS.NOW,
        },
      },
      height: {
        dataType: "number",
        label: $localize`:Label for height in cm of a health check:Height [cm]`,
        viewComponent: "DisplayUnit",
        additional: "cm",
      },
      weight: {
        dataType: "number",
        label: $localize`:Label for weight in kg of a health check:Weight [kg]`,
        viewComponent: "DisplayUnit",
        additional: "kg",
      },
    }
  },
  "entity:ChildSchoolRelation": {
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
        label: $localize`:Label for the child of a relation:Child`,
      },
      schoolId: {
        dataType: "entity",
        additional: "School",
        entityReferenceRole: "aggregate",
        validators: {
          required: true,
        },
        anonymize: "retain",
        label: $localize`:Label for the school of a relation:School`,
      },
      schoolClass: {
        dataType: "string",
        label: $localize`:Label for the class of a relation:Class`,
        anonymize: "retain",
      },
      start: {
        dataType: "date-only",
        label: $localize`:Label for the start date of a relation:Start date`,
        description: $localize`:Description of the start date of a relation:The date a child joins a school`,
        anonymize: "retain",
      },
      end: {
        dataType: "date-only",
        label: $localize`:Label for the end date of a relation:End date`,
        description: $localize`:Description of the end date of a relation:The date of a child leaving the school`,
        anonymize: "retain",
      },
      result: {
        dataType: "percentage",
        label: $localize`:Label for the percentage result of a relation:Result`,
        validators: {
          min: 0,
          max: 100,
        },
      },
    }
  },

  ...todoDefaultConfigs,
};
