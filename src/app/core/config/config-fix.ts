import { Child } from "../../child-dev-project/children/model/child";
import { School } from "../../child-dev-project/schools/model/school";
import { ChildSchoolRelation } from "../../child-dev-project/children/model/childSchoolRelation";
import { EventNote } from "../../child-dev-project/attendance/model/event-note";

// prettier-ignore
export const defaultJsonConfig = {
  "appConfig": {
    "default_language": "en-US",
    "displayLanguageSelect": true,
    "logo_path": null,
    "site_name": $localize`:Page title:Aam Digital - DEMO (automatically generated data)`,
  },
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
        "name": $localize`:Menu item:Admin`,
        "icon": "wrench",
        "link": "/admin"
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
        "name": $localize`:Menu item:Database Conflicts`,
        "icon": "wrench",
        "link": "/admin/conflicts"
      },
      {
        "name": $localize`:Menu item:Help`,
        "icon": "question",
        "link": "/help"
      },
    ]
  },
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
          "label": $localize`:Filter label:Status`,
          "type": "prebuilt"
        },
        {
          "id": "date",
          "type": "prebuilt"
        },
        {
          "id": "category"
        }
      ],
      "exportConfig": [
        { "label": "event_id", "query": "_id" },
        { "label": "date", "query": "date" },
        { "label": "event title", "query": "subject" },
        { "label": "event type", "query": "category" },
        { "label": "event description", "query": "text" },
        {
          "query": ":getAttendanceArray(true)",
          "subQueries": [
            {
              "query": ".participant:toEntities(Child)",
              "subQueries": [
                { "label": "participant_id", "query": "_id" },
                { "label": "participant", "query": "name" },
                { "label": "gender", "query": "gender" },
                { "label": "religion", "query": "religion" },
              ]
            },
            {
              "label": "status",
              "query": ".status._status.id",
            },
            {
              "query": ".school:toEntities(School)",
              "subQueries": [
                { "label": "school_name", "query": "name" },
                { "label": "school_id", "query": "entityId" }
              ]
            }
          ],
        },
      ]
    }
  },
  "view:admin": {
    "component": "Admin",
    "permittedUserRoles": ["admin_app"]
  },
  "view:admin/config-import": {
    "component": "ConfigImport",
    "permittedUserRoles": ["admin_app"]
  },
  "view:admin/conflicts": {
    "component": "ConflictResolution",
    "permittedUserRoles": ["admin_app"]
  },
  "view:import": {
    "component": "Import",
    "permittedUserRoles": ["admin_app"]
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
                "cols": [
                  [
                    "name",
                  ],
                  [
                    "phone"
                  ]
                ]
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
                "cols": [
                  [
                    "name",
                    "privateSchool"
                  ],
                  [
                    "address",
                    "phone"
                  ],
                  [
                    "language",
                    "timing",
                  ],
                  [
                    "remarks"
                  ]
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
      "columns": [
        {
          "view": "ChildBlock",
          "label": $localize`:Column title for ChildBlockComponents:Name`,
          "id": "name"
        },
        {
          "view": "DisplayAge",
          "label": $localize`:Column label for age of child:Age`,
          "id": "age",
          "additional": "dateOfBirth"
        },
        {
          "view": "DisplayText",
          "label": $localize`:Column label for class which child attends:Class`,
          "id": "schoolClass"
        },
        {
          "view": "DisplayEntityArray",
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
          "id": "isActive",
          "type": "boolean",
          "default": "true",
          "label": $localize`Children`,
          "true": $localize`:Active children filter label - true case:Active`,
          "false": $localize`:Active children filter label - false case:Inactive`,
          "all": $localize`:Active children unselect option:All`
        },
        {
          "id": "center"
        },
        {
          "id": "schoolId",
          "type": "School",
          "label": $localize`:Label of schools filter:School`
        }
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
                "cols": [
                  ["photo2"],
                  [
                    "name",
                    "projectNumber",
                    "admissionDate",
                  ],
                  [
                    "dateOfBirth",
                    "birth_certificate",
                    "gender",
                    "motherTongue"
                  ],
                  [
                    "center",
                    "status",
                    "address",
                    "phone"
                  ]
                ],
                "headers": [
                  null,
                  $localize`:Header for form section:Personal Information`,
                  $localize`:Header for form section:Additional`,
                  $localize`:Header for form section:Scholar activities`,
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
                    id: "start",
                    visibleFrom: "sm",
                  },
                  {
                    id: "end",
                    visibleFrom: "sm",
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
                  "availableFilters": [{ "id": "language" }],
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
                "cols": [
                  ["health_bloodGroup"],
                  ["health_lastDentalCheckup"]
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
                { id: "isMotivatedDuringClass", visibleFrom: "lg" },
                { id: "isParticipatingInClass", visibleFrom: "lg" },
                { id: "isInteractingWithOthers", visibleFrom: "lg" },
                { id: "doesHomework", visibleFrom: "lg" },
                { id: "asksQuestions", visibleFrom: "lg" },
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
  "view:attendance/recurring-activity": {
    "component": "EntityList",
    "config": {
      "entity": "RecurringActivity",
      "columns": [
        "title",
        "type",
        "assignedTo"
      ],
      "filters": [
        {
          "id": "isActive",
          "type": "boolean",
          "default": "true",
          "label": $localize`Status`,
          "true": $localize`:Active records filter label - true case:Active`,
          "false": $localize`:Active records filter label - false case:Inactive`,
          "all": $localize`:Active records unselect option:All`
        },
      ],
      "exportConfig": [
        { label: "Title", query: "title" },
        { label: "Type", query: "type" },
        { label: "Assigned users", query: "assignedTo" }
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
                "cols": [
                  ["title"],
                  ["type", "inactive"],
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
                  "participants",
                  "excludedParticipants"
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
              "groupBy": ["gender"],
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
                  "groupBy": ["gender"],
                },
                {
                  "label": $localize`:Label for report query:Private schools`,
                  "query": `[*privateSchool=true]`
                },
                {
                  "query": `[*privateSchool=true]:getRelated(${ChildSchoolRelation.ENTITY_TYPE}, schoolId)[*isActive=true].childId:addPrefix(${Child.ENTITY_TYPE}):unique:toEntities`,
                  "label": $localize`:Label for report query:Children attending a private school`,
                  "groupBy": ["gender"],
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
                  "groupBy": ["gender"],
                  "label": $localize`:Label for a report query:Participants`
                }
              ]
            }
          ],
        },
        {
          "title": $localize`:Name of a report:Attendance Report`,
          "mode": "exporting",
          "aggregationDefinitions": [
            {
              "query": `${EventNote.ENTITY_TYPE}:toArray[* date >= ? & date <= ?]`,
              groupBy: { label: "Type", property: "category" },
              "subQueries": [
                {
                  query: ":getAttendanceArray:getAttendanceReport",
                  subQueries: [
                    {
                      "label": $localize`:Name of a column of a report:Name`,
                      "query": `.participant:toEntities(Child).name`
                    },
                    {
                      "label": $localize`:Name of a column of a report:Total`,
                      "query": `total`
                    },
                    {
                      "label": $localize`:Name of a column of a report:Present`,
                      "query": `present`
                    },
                    {
                      "label": $localize`:Name of a column of a report:Rate`,
                      "query": `percentage`
                    },
                    {
                      "label": $localize`:Name of a column of a report:Late`,
                      "query": `detailedStatus.LATE`
                    }
                  ]
                }
              ]
            },
          ],
        },
      ]
    }
  },

  "entity:Child": {
    "label": $localize`:Label for child:Child`,
    "labelPlural": $localize`:Plural label for child:Children`,
    "attributes": [
      {
        "name": "address",
        "schema": {
          dataType: "location",
          label: $localize`:Label for the address of a child:Address`
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
        "name": "religion",
        "schema": {
          dataType: "string",
          label: $localize`:Label for the religion of a child:Religion`
        }
      },
      {
        "name": "motherTongue",
        "schema": {
          dataType: "string",
          label: $localize`:Label for the mother tongue of a child:Mother Tongue`,
          description: $localize`:Tooltip description for the mother tongue of a child:The primary language spoken at home`,
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
        "name": "birth_certificate",
        "schema": {
          dataType: "file",
          label: $localize`:Label for a child attribute:Birth certificate`
        }
      }
    ]
  },
  "entity:School": {
    "attributes": [
      {
        "name": "name",
        "schema": {
          dataType: "string",
          label: $localize`:Label for the name of a school:Name`
        }
      },
      {
        "name": "privateSchool",
        "schema": {
          dataType: "boolean",
          label: $localize`:Label for if a school is a private school:Private School`
        }
      },
      {
        "name": "language",
        "schema": {
          dataType: "string",
          label: $localize`:Label for the language of a school:Language`
        }
      },
      {
        "name": "address",
        "schema": {
          dataType: "location",
          label: $localize`:Label for the address of a school:Address`
        }
      },
      {
        "name": "phone",
        "schema": {
          dataType: "string",
          label: $localize`:Label for the phone number of a school:Phone Number`
        }
      },
      {
        "name": "timing",
        "schema": {
          dataType: "string",
          label: $localize`:Label for the timing of a school:School Timing`
        }
      },
      {
        "name": "remarks",
        "schema": {
          dataType: "string",
          label: $localize`:Label for the remarks for a school:Remarks`
        }
      }
    ]
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
          label: $localize`:Label for a child attribute:Participating`,
          description: $localize`:Description for a child attribute:The child is actively participating in the class.`
        }
      },
      {
        "name": "isInteractingWithOthers",
        "schema": {
          "dataType": "configurable-enum",
          "innerDataType": "rating-answer",
          label: $localize`:Label for a child attribute:Interacting`,
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
        "name": "asksQuestions",
        "schema": {
          "dataType": "configurable-enum",
          "innerDataType": "rating-answer",
          label: $localize`:Label for a child attribute:Asking Questions`,
          description: $localize`:Description for a child attribute:The child is asking questions during the class.`
        }
      },
    ]
  },
  "entity:User": {
    attributes: [
      {
        name: "phone",
        schema: {
          dataType: "string",
          label: $localize`:Label of user phone:Contact`
        }
      },
    ]
  },
  "view:matching": {
    component: "MatchingEntities",
    config: {
      rightSide: {
        entityType: School.ENTITY_TYPE,
        prefilter: { "privateSchool": true },
        availableFilters: [{ "id": "language" }],
      },
      leftSide: { entityType: Child.ENTITY_TYPE },
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
    "attributes": []
  },
  "view:todo": {
    "component": "TodoList",
    "config": {
      "entity": "Todo",
      "columns": ["deadline", "subject", "assignedTo", "startDate", "relatedEntities"],
      "filters": [
        { "id": "assignedTo" },

        {
          "id": "due-status",
          "type": "prebuilt"
        }
      ]
    }
  }
};
