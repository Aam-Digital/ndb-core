import { defaultAttendanceStatusTypes } from "./default-config/default-attendance-status-types";
import { defaultInteractionTypes } from "./default-config/default-interaction-types";
import { Child } from "../../child-dev-project/children/model/child";
import { School } from "../../child-dev-project/schools/model/school";
import { ChildSchoolRelation } from "../../child-dev-project/children/model/childSchoolRelation";
import { EventNote } from "../../child-dev-project/attendance/model/event-note";
import { genders } from "../../child-dev-project/children/model/genders";
import { materials } from "../../child-dev-project/children/educational-material/model/materials";
import {
  mathLevels,
  readingLevels,
} from "../../child-dev-project/children/aser/model/skill-levels";
import { warningLevels } from "../../child-dev-project/warning-levels";
import { ratingAnswers } from "../../features/historical-data/model/rating-answers";

// prettier-ignore
export const defaultJsonConfig = {
  "appConfig": {
    "displayLanguageSelect": false,
    "logo_path": "assets/child-photos/logo-hostage-italia.jpg",
    "site_name": "Sistema dati Hostage Italia edita da Aam Digital"
  },
  "appConfig:usage-analytics": {
    "url": "https://matomo.aam-digital.org",
    "site_id": "4"
  },
  "navigationMenu": {
    "items": [
      {
        "name": "Dashboard",
        "icon": "home",
        "link": "/"
      },
      {
        "name": "Casi",
        "icon": "child",
        "link": "/child"
      },
      {
        "name": "Case Worker / Volontari professionisti",
        "icon": "user-tie",
        "link": "/school"
      },
      {
        "name": "Note & Attivita'",
        "icon": "file-alt",
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
        "link": "/user"
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
        "name": "Assistenza",
        "icon": "question",
        "link": "/help"
      }
    ]
  },
  "enum:interaction-type": [
    {
      "id": "",
      "label": ""
    },
    {
      "id": "IN_PERSON",
      "label": "In persona"
    },
    {
      "id": "EMAIL",
      "label": "Email"
    },
    {
      "id": "PHONE",
      "label": "Phone"
    },
    {
      "id": "INCIDENT",
      "label": "Incontro straordinario"
    },
    {
      "id": "WORKSHOP",
      "label": "Workshop / Seminar",
      "isMeeting": true
    },
    {
      "id": "TRAINING",
      "label": "Training",
      "isMeeting": true
    }
  ],
  "enum:attendance-status": [
    {
      "id": "PRESENT",
      "shortName": "P",
      "label": "Present",
      "style": "attendance-P",
      "countAs": "PRESENT"
    },
    {
      "id": "ABSENT",
      "shortName": "A",
      "label": "Absent",
      "style": "attendance-A",
      "countAs": "ABSENT"
    },
    {
      "id": "EXCUSED",
      "shortName": "E",
      "label": "Excused",
      "style": "attendance-E",
      "countAs": "IGNORE"
    }
  ],
  "enum:materials": [
    {
      "id": "OTHER",
      "label": "Altro"
    },
    {
      "id": "ENTERTAINMENT",
      "label": "Intrattenimenti"
    },
    {
      "id": "TRAVEL",
      "label": "Viaggi"
    },
    {
      "id": "MATERIALS",
      "label": "Materiale"
    },
    {
      "id": "ACCOMMODATION",
      "label": "Pernottamenti"
    }
  ],
  "enum:warning-levels": [
    {
      "id": "",
      "label": ""
    },
    {
      "id": "INFO",
      "label": "Solo informazione"
    },
    {
      "id": "OK",
      "label": "Risolto"
    },
    {
      "id": "WARNING",
      "label": "Da seguire"
    },
    {
      "id": "URGENT",
      "label": "Da seguire: urgente"
    }
  ],
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
  "enum:rating-answer": [
    {
      "id": "notTrueAtAll",
      "label": "not true at all"
    },
    {
      "id": "rarelyTrue",
      "label": "rarely true"
    },
    {
      "id": "usuallyTrue",
      "label": "usually true"
    },
    {
      "id": "absolutelyTrue",
      "label": "absolutely True"
    },
    {
      "id": "noAnswerPossible",
      "label": "no answer possible"
    }
  ],
  "view:": {
    "component": "Dashboard",
    "config": {
      "widgets": [
        {
          "component": "DashboardShortcutWidget",
          "config": {
            "shortcuts": [
              {
                "label": "Inserire incontro",
                "icon": "calendar-check",
                "link": "/attendance/add-day"
              }
            ]
          }
        },
        {
          "component": "ChildrenCountDashboard"
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
          "component": "ProgressDashboard",
          "config": {
            "dashboardConfigId": "1"
          }
        },
        {
          "component": "BirthdayDashboard"
        }
      ]
    },
    "_id": "view:"
  },
  "view:note": {
    "component": "NotesManager",
    "config": {
      "title": "Note & Attivita'",
      "includeEventNotes": false,
      "columns": [
        {
          "id": "children",
          "noSorting": true
        }
      ],
      "columnGroups": {
        "default": "Appunti registrati",
        "mobile": "Mobile",
        "groups": [
          {
            "name": "Appunti registrati",
            "columns": [
              "date",
              "subject",
              "category",
              "authors",
              "children"
            ]
          },
          {
            "name": "Eventi / Attivita'",
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
          "type": "prebuilt",
          "label": "Status"
        },
        {
          "id": "date",
          "type": "prebuilt"
        },
        {
          "id": "category",
          "display": "dropdown"
        }
      ],
      "exportConfig": [
        {
          "label": "event_id",
          "query": "_id"
        },
        {
          "label": "Data",
          "query": "date"
        },
        {
          "label": "event title",
          "query": "subject"
        },
        {
          "label": "event type",
          "query": "category"
        },
        {
          "label": "event description",
          "query": "text"
        },
        {
          "query": ":getAttendanceArray",
          "subQueries": [
            {
              "query": ".participant:toEntities(Child)",
              "subQueries": [
                {
                  "label": "participant_id",
                  "query": "_id"
                },
                {
                  "label": "participant",
                  "query": "name"
                },
                {
                  "label": "gender",
                  "query": "gender"
                },
                {
                  "label": "religion",
                  "query": "religion"
                }
              ]
            },
            {
              "label": "status",
              "query": ".status._status.id"
            }
          ]
        }
      ]
    },
    "_id": "view:note"
  },
  "view:admin": {
    "component": "Admin",
    "permittedUserRoles": [
      "admin_app"
    ],
    "_id": "view:admin"
  },
  "view:user": {
    "component": "EntityList",
    "config": {
      "title": "Users",
      "entity": "User",
      "columns": [
        "name"
      ]
    },
    "permittedUserRoles": [
      "admin_app"
    ],
    "_id": "view:users"
  },
  "view:user/:id": {
    "component": "EntityDetails",
    "config": {
      "entity": "User",
      "panels": [
        {
          "title": "User Information",
          "components": [
            {
              "title": "",
              "component": "Form",
              "config": {
                "cols": [
                  [
                    "name"
                  ]
                ]
              }
            }
          ]
        }
      ],
      "icon": "user"
    },
    "permittedUserRoles": [
      "admin_app"
    ]
  },
  "view:admin/conflicts": {
    "component": "ConflictResolution",
    "permittedUserRoles": [
      "admin_app"
    ],
    "lazyLoaded": true,
    "_id": "view:admin/conflicts"
  },
  "view:help": {
    "component": "MarkdownPage",
    "config": {
      "markdownFile": "assets/help/help.it.md"
    },
    "_id": "view:help"
  },
  "view:attendance": {
    "component": "AttendanceManager",
    "_id": "view:attendance"
  },
  "view:attendance/add-day": {
    "component": "AddDayAttendance",
    "_id": "view:attendance/add-day"
  },
  "view:school": {
    "component": "EntityList",
    "config": {
      "entity": "School",
      "title": "Case Worker / Professionista volontario",
      "columns": [
        "name",
        "location",
        "HIExperience",
        "HITraining",
        "signedNDA"
      ],
      "filters": [
        {
          "id": "profession",
          "display": "dropdown"
        },
        {
          "id": "location",
          "display": "dropdown"
        }
      ]
    },
    "_id": "view:school"
  },
  "view:school/:id": {
    "component": "EntityDetails",
    "config": {
      "entity": "School",
      "title": "Case Worker / Professionista volontario",
      "panels": [
        {
          "title": "Scheda professionista volontario",
          "components": [
            {
              "title": "",
              "component": "Form",
              "config": {
                "cols": [
                  [
                    "name",
                    "location",
                    "phone",
                    "email",
                    "languages"
                  ],
                  [
                    "profession",
                    "employer",
                    "remarks"
                  ],
                  [
                    "availabilityLimitations",
                    "HITraining",
                    "HIExperience",
                    "signedNDA"
                  ],
                  [
                    "scopeItalia",
                    "scopeRegione",
                    "scopeProvincia",
                    "scopeCitta"
                  ]
                ]
              }
            }
          ]
        },
        {
          "title": "Casi",
          "components": [
            {
              "title": "",
              "component": "ChildrenOverview",
              "config": {
                "columns": [
                  "childId",
                  "start",
                  "end",
                  "caseIntro"
                ]
              }
            }
          ]
        }
      ],
      "icon": "user-tie"
    },
    "_id": "view:school/:id"
  },
  "view:child": {
    "component": "ChildrenList",
    "config": {
      "title": "Lista dei casi",
      "columns": [
        {
          "view": "ChildBlock",
          "label": "Nome",
          "id": "name"
        },
        {
          "view": "DisplayText",
          "label": "Eta'",
          "id": "age"
        },
        {
          "view": "DisplayEntity",
          "label": "Case Worker",
          "id": "schoolId",
          "additional": "School",
          "noSorting": true
        }
      ],
      "columnGroups": {
        "default": "Case Info",
        "mobile": "Mobile",
        "groups": [
          {
            "name": "Case Info",
            "columns": [
              "projectNumber",
              "name",
              "age",
              "gender",
              "recordType",
              "status",
              "schoolId"
            ]
          },
          {
            "name": "Contatti",
            "columns": [
              "projectNumber",
              "name",
              "caseworkerAllocated",
              "caseworkerName",
              "phone",
              "email",
              "preferredContactMeans",
              "preferredContactTime"
            ]
          },
          {
            "name": "Mobile",
            "columns": [
              "projectNumber",
              "name",
              "caseworkerName"
            ]
          }
        ]
      },
      "filters": [
        {
          "id": "isActive",
          "label": "Casi",
          "type": "boolean",
          "default": "true",
          "true": "Casi Attivi",
          "false": "Casi Inattivi",
          "all": "All"
        },
        {
          "id": "recordType",
          "display": "dropdown"
        },
        {
          "id": "schoolId",
          "type": "School",
          "label": "Case Worker",
          "display": "dropdown"
        }
      ]
    },
    "_id": "view:child"
  },
  "view:child/:id": {
    "component": "EntityDetails",
    "config": {
      "icon": "child",
      "entity": "Child",
      "title": "Caso",
      "panels": [
        {
          "title": "Cartella",
          "components": [
            {
              "title": "",
              "component": "Form",
              "config": {
                "cols": [
                  [
                    "photo"
                  ],
                  [
                    "name",
                    "dateOfBirth",
                    "gender",
                    "projectNumber",
                    "admissionDate"
                  ],
                  [
                    "recordType",
                    "status",
                    "caseworkerAllocated",
                    "caseworkerName"
                  ],
                  [
                    "location",
                    "phone",
                    "email",
                    "preferredContactMeans",
                    "preferredContactTime"
                  ]
                ]
              }
            }
          ]
        },
        {
          "title": "Gestione",
          "components": [
            {
              "component": "PreviousSchools",
              "config": {
                "single": false,
                "columns": [
                  "schoolId",
                  "start",
                  "end",
                  "caseIntro"
                ]
              }
            }
          ]
        },
        {
          "title": "Appunti & Note",
          "components": [
            {
              "title": "",
              "component": "NotesOfChild"
            }
          ]
        },
        {
          "title": "Spese & Materiali",
          "components": [
            {
              "title": "",
              "component": "EducationalMaterial",
              "config": {
                "columns": [
                  "date",
                  "materialType",
                  "materialAmount",
                  "description",
                  "receipt"
                ]
              }
            }
          ]
        },
        {
          "title": "Chiusura caso",
          "components": [
            {
              "title": "",
              "component": "Form",
              "config": {
                "cols": [
                  [
                    "dropoutDate"
                  ],
                  [
                    "dropoutType"
                  ],
                  [
                    "dropoutRemarks"
                  ]
                ]
              }
            }
          ]
        }
      ]
    },
    "_id": "view:child/:id"
  },
  "view:attendance/recurring-activity": {
    "component": "EntityList",
    "config": {
      "entity": "RecurringActivity",
      "title": "Recurring Activities",
      "columns": [
        "title",
        "type",
        "assignedTo"
      ],
      "exportConfig": [
        {
          "label": "Title",
          "query": "title"
        },
        {
          "label": "Type",
          "query": "type"
        },
        {
          "label": "Assigned users",
          "query": "assignedTo"
        }
      ]
    },
    "_id": "view:attendance/recurring-activity"
  },
  "view:attendance/recurring-activity/:id": {
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
                  [
                    "title"
                  ],
                  [
                    "type"
                  ],
                  [
                    "assignedTo"
                  ]
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
                "cols": [
                  [
                    "linkedGroups",
                    "participants"
                  ]
                ]
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
      "icon": "calendar-alt"
    },
    "_id": "view:attendance/recurring-activity/:id"
  },
  "view:report": {
    "component": "Reporting",
    "config": {
      "reports": [
        {
          "title": "ReportReport: Eventi & attivita'",
          "aggregationDefinitions": [
            {
              "query": "Child:toArray[*isActive=true]",
              "label": "All children",
              "aggregations": [
                {
                  "label": "Male children",
                  "query": ":filterByObjectAttribute(gender, id, M)"
                },
                {
                  "label": "Female children",
                  "query": ":filterByObjectAttribute(gender, id, F)"
                }
              ]
            },
            {
              "query": "School:toArray",
              "label": "All schools",
              "aggregations": [
                {
                  "label": "Children attending a school",
                  "query": ":getRelated(ChildSchoolRelation, schoolId)[*isActive=true].childId:unique"
                },
                {
                  "label": "Governmental schools",
                  "query": "[*privateSchool!=true]"
                },
                {
                  "query": "[*privateSchool!=true]:getRelated(ChildSchoolRelation, schoolId)[*isActive=true].childId:addPrefix(Child):unique:toEntities",
                  "label": "Children attending a governmental school",
                  "aggregations": [
                    {
                      "label": "Male children attending a governmental school",
                      "query": ":filterByObjectAttribute(gender, id, M)"
                    },
                    {
                      "label": "Female children attending a governmental school",
                      "query": ":filterByObjectAttribute(gender, id, F)"
                    }
                  ]
                },
                {
                  "label": "Private schools",
                  "query": "[*privateSchool=true]"
                },
                {
                  "query": "[*privateSchool=true]:getRelated(ChildSchoolRelation, schoolId)[*isActive=true].childId:addPrefix(Child):unique:toEntities",
                  "label": "Children attending a private school",
                  "aggregations": [
                    {
                      "label": "Male children attending a private school",
                      "query": ":filterByObjectAttribute(gender, id, M)"
                    },
                    {
                      "label": "Female children attending a private school",
                      "query": ":filterByObjectAttribute(gender, id, F)"
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          "title": "Report: Eventi & attivita'",
          "aggregationDefinitions": [
            {
              "query": "EventNote:toArray[*date >= ? & date <= ?]",
              "groupBy": [
                "category"
              ],
              "label": "Events",
              "aggregations": [
                {
                  "query": ":getParticipantsWithAttendance(PRESENT):unique:addPrefix(Child):toEntities",
                  "groupBy": [
                    "gender"
                  ],
                  "label": "Participants"
                }
              ]
            }
          ]
        },
        {
          "title": "Report annuale Hostage Italia",
          "aggregationDefinitions": [
            {
              "query": "EventNote:toArray:addEntities(Note)[*date >= ? & date <= ?]",
              "groupBy": [
                "category"
              ],
              "label": "Events",
              "aggregations": [
                {
                  "query": ":getParticipantsWithAttendance(PRESENT):unique:addPrefix(Child):toEntities",
                  "groupBy": [
                    "gender",
                    "religion"
                  ],
                  "label": "Participants"
                }
              ]
            }
          ]
        }
      ]
    },
    "_id": "view:report"
  },
  "entity:ChildSchoolRelation": {
    "attributes": [
      {
        "name": "childId",
        "schema": {
          "label": "Caso",
          "viewComponent": "DisplayEntity",
          "editComponent": "EditSingleEntity",
          "additional": "Child",
          "validators": {
            "required": true
          }
        }
      },
      {
        "name": "schoolId",
        "schema": {
          "label": "Volontario professionista",
          "viewComponent": "DisplayEntity",
          "editComponent": "EditSingleEntity",
          "additional": "School",
          "validators": {
            "required": true
          }
        }
      },
      {
        "name": "caseIntro",
        "schema": {
          "dataType": "string",
          "editComponent": "EditLongText",
          "label": "Nota introduttiva del caso"
        }
      }
    ]
  },
  "entity:Child": {
    "attributes": [
      {
        "name": "projectNumber",
        "schema": {
          "dataType": "string",
          "label": "Codice"
        }
      },
      {
        "name": "admissionDate",
        "schema": {
          "dataType": "date-only",
          "label": "Data di apertura"
        }
      },
      {
        "name": "gender",
        "schema": {
          "dataType": "configurable-enum",
          "innerDataType": "genders",
          "label": "Sesso"
        }
      },
      {
        "name": "recordType",
        "schema": {
          "dataType": "configurable-enum",
          "innerDataType": "record-type",
          "label": "Tipologia beneficiario"
        }
      },
      {
        "name": "location",
        "schema": {
          "dataType": "string",
          "label": "Citta'"
        }
      },
      {
        "name": "phone",
        "schema": {
          "dataType": "string",
          "label": "Tel."
        }
      },
      {
        "name": "email",
        "schema": {
          "dataType": "string",
          "label": "Email"
        }
      },
      {
        "name": "caseworkerAllocated",
        "schema": {
          "dataType": "boolean",
          "label": "Assengato case worker?"
        }
      },
      {
        "name": "caseworkerName",
        "schema": {
          "dataType": "string",
          "viewComponent": "DisplayEntity",
          "editComponent": "EditSingleEntity",
          "additional": "School",
          "label": "Case Worker"
        }
      },
      {
        "name": "preferredContactMeans",
        "schema": {
          "dataType": "configurable-enum",
          "innerDataType": "contact-means",
          "label": "Modalita' di contatto"
        }
      },
      {
        "name": "preferredContactTime",
        "schema": {
          "dataType": "configurable-enum",
          "innerDataType": "contact-time",
          "label": "Orario preferito"
        }
      },
      {
        "name": "dropoutDate",
        "schema": {
          "dataType": "date",
          "label": "Data di chiusura"
        }
      },
      {
        "name": "dropoutType",
        "schema": {
          "dataType": "string",
          "label": "Motivo della chiusura"
        }
      },
      {
        "name": "dropoutRemarks",
        "schema": {
          "dataType": "string",
          "label": "Osservazioni"
        }
      }
    ],
    "_id": "entity:Child"
  },
  "enum:genders": [
    {
      "id": "",
      "label": ""
    },
    {
      "id": "M",
      "label": "male"
    },
    {
      "id": "F",
      "label": "female"
    },
    {
      "id": "X",
      "label": "Non-binary/third gender"
    }
  ],
  "enum:record-type": [
    {
      "id": "",
      "label": ""
    },
    {
      "id": "HOSTAGE",
      "label": "Ostaggio"
    },
    {
      "id": "FAMILY",
      "label": "Familiare"
    },
    {
      "id": "FRIEND",
      "label": "Amico o Collega"
    }
  ],
  "enum:contact-means": [
    {
      "id": "",
      "label": ""
    },
    {
      "id": "EMAIL",
      "label": "email"
    },
    {
      "id": "PHONE",
      "label": "phone"
    }
  ],
  "enum:contact-time": [
    {
      "id": "",
      "label": ""
    },
    {
      "id": "MORNING",
      "label": "morning"
    },
    {
      "id": "AFTERNOON",
      "label": "afternoon"
    },
    {
      "id": "EVENING",
      "label": "evening"
    }
  ],
  "entity:School": {
    "attributes": [
      {
        "name": "name",
        "schema": {
          "dataType": "string",
          "label": "Nome",
          "validators": {
            "required": true
          }
        }
      },
      {
        "name": "location",
        "schema": {
          "dataType": "string",
          "label": "Citta'"
        }
      },
      {
        "name": "phone",
        "schema": {
          "dataType": "string",
          "label": "Phone"
        }
      },
      {
        "name": "email",
        "schema": {
          "dataType": "string",
          "label": "Email"
        }
      },
      {
        "name": "languages",
        "schema": {
          "dataType": "string",
          "label": "Lingue parlate"
        }
      },
      {
        "name": "profession",
        "schema": {
          "dataType": "string",
          "label": "Professione"
        }
      },
      {
        "name": "employer",
        "schema": {
          "dataType": "string",
          "label": "Datore di lavoro"
        }
      },
      {
        "name": "remarks",
        "schema": {
          "dataType": "string",
          "label": "Osservazioni"
        }
      },
      {
        "name": "availabilityLimitations",
        "schema": {
          "dataType": "string",
          "label": "Disponibilita'"
        }
      },
      {
        "name": "HITraining",
        "schema": {
          "dataType": "date-only",
          "label": "Data formazione Hostage Italia",
          "description": "Date completed; If empty, no training has been done"
        }
      },
      {
        "name": "HIExperience",
        "schema": {
          "dataType": "configurable-enum",
          "innerDataType": "HI-experience",
          "label": "Esperienza con Hostage Italia"
        }
      },
      {
        "name": "scopeItalia",
        "schema": {
          "dataType": "boolean",
          "label": "Italia"
        }
      },
      {
        "name": "scopeRegione",
        "schema": {
          "dataType": "boolean",
          "label": "Regione"
        }
      },
      {
        "name": "scopeProvincia",
        "schema": {
          "dataType": "boolean",
          "label": "Provincia"
        }
      },
      {
        "name": "scopeCitta",
        "schema": {
          "dataType": "boolean",
          "label": "Citta'"
        }
      },
      {
        "name": "signedNDA",
        "schema": {
          "dataType": "boolean",
          "label": "AND Firmato"
        }
      }
    ],
    "_id": "entity:School"
  },
  "enum:HI-experience": [
    {
      "id": "",
      "label": ""
    },
    {
      "id": "EX_HOSTAGE",
      "label": "Ex-ostaggio"
    },
    {
      "id": "FAMILY",
      "label": "Familiare"
    },
    {
      "id": "PROFESSIONAL",
      "label": "Professionista"
    },
    {
      "id": "NONE",
      "label": "Nessuno"
    }
  ],
  "entity:EducationalMaterial": {
    "attributes": [
      {
        "name": "materialType",
        "schema": {
          "dataType": "configurable-enum",
          "innerDataType": "materials",
          "label": "Tipo di spesa"
        }
      },
      {
        "name": "materialAmount",
        "schema": {
          "dataType": "number",
          "label": "Somma"
        }
      },
      {
        "name": "description",
        "schema": {
          "dataType": "string",
          "label": "Descrizione"
        }
      },
      {
        "name": "receipt",
        "schema": {
          "dataType": "string",
          "label": "Ricevuta registrata"
        }
      }
    ]
  }
};
