import { defaultAttendanceStatusTypes } from "./default-config/default-attendance-status-types";
import { defaultInteractionTypes } from "./default-config/default-interaction-types";
import { Child } from "../../child-dev-project/children/model/child";
import { Gender } from "../../child-dev-project/children/model/Gender";
import { School } from "../../child-dev-project/schools/model/school";
import { ChildSchoolRelation } from "../../child-dev-project/children/model/childSchoolRelation";
import { EventNote } from "../../child-dev-project/attendance/model/event-note";
import { ColumnDescriptionInputType } from "../entity-components/entity-subrecord/column-description-input-type.enum";

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
      id: "noAnswerPossible",
      label: "no answer possible",
    },
    {
      id: "notTrueAtAll",
      label: "not true at all",
    },
    {
      id: "rarelyTrue",
      label: "rarely true",
    },
    {
      id: "usuallyTrue",
      label: "usually true",
    },
    {
      id: "absolutelyTrue",
      label: "absolutely true",
    },
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
      "addNew": "Add note",
      "filterPlaceholder": "i.e. title, author",
      "columns": [
        {
          "component": "DisplayDate",
          "title": "Date",
          "id": "date"
        },
        {
          "component": "DisplayText",
          "title": "Subject",
          "id": "subject"
        },
        {
          "component": "DisplayConfigurableEnum",
          "title": "Category",
          "id": "category"
        },
        {
          "component": "DisplayUsers",
          "title": "Authors",
          "id": "authors"
        },
        {
          "component": "ChildBlockList",
          "title": "Children",
          "id": "children",
          "noSorting": true
        }
      ],
      "columnGroup": {
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
          "label": "Category",
          "type": "configurable-enum",
          "enumId": "interaction-type",
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
      "addNew": "Add school",
      "filterPlaceholder": "i.e. School name",
      "columns": [
        {
          "component": "DisplayText",
          "title": "Name",
          "id": "name"
        },
        {
          "component": "DisplayText",
          "title": "Medium",
          "id": "medium"
        },
        {
          "component": "DisplayCheckmark",
          "title": "Private School",
          "id": "privateSchool"
        },
        {
          "component": "DisplayText",
          "title": "Board",
          "id": "academicBoard"
        },
        {
          "component": "DisplayText",
          "title": "Up to class",
          "id": "upToClass"
        }
      ],
      "filters": [
        {
          "id": "medium"
        },
        {
          "id": "privateSchool",
          "type": "boolean",
          "default": "",
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
                  [
                    {
                      "input": "text",
                      "id": "name",
                      "placeholder": "Name"
                    }
                  ],
                  [
                    {
                      "input": "text",
                      "id": "medium",
                      "placeholder": "Medium"
                    }
                  ],
                  [
                    {
                      "input": "checkbox",
                      "id": "privateSchool",
                      "placeholder": "Private School"
                    }
                  ],
                  [
                    {
                      "input": "text",
                      "id": "academicBoard",
                      "placeholder": "Board"
                    }
                  ],
                  [
                    {
                      "input": "text",
                      "id": "phone",
                      "placeholder": "Contact Number"
                    }
                  ],
                  [
                    {
                      "input": "text",
                      "id": "address",
                      "placeholder": "Address"
                    }
                  ],
                  [
                    {
                      "input": "text",
                      "id": "website",
                      "placeholder": "Website"
                    }
                  ],
                  [
                    {
                      "input": "text",
                      "id": "timing",
                      "placeholder": "School Timing"
                    }
                  ],
                  [
                    {
                      "input": "text",
                      "id": "workingDays",
                      "placeholder": "Working Days"
                    }
                  ],
                  [
                    {
                      "input": "text",
                      "id": "upToClass",
                      "placeholder": "Teaching up to class"
                    }
                  ],
                  [
                    {
                      "input": "textarea",
                      "id": "remarks",
                      "placeholder": "Remarks"
                    }
                  ]
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
      "addNew": "Add participant",
      "filterPlaceholder": "i.e. Participant name",
      "columns": [
        {
          "component": "DisplayText",
          "title": "PN",
          "id": "projectNumber"
        },
        {
          "component": "ChildBlock",
          "title": "Name",
          "id": "name"
        },
        {
          "component": "DisplayText",
          "title": "Age",
          "id": "age"
        },
        {
          "component": "DisplayDate",
          "title": "DoB",
          "id": "dateOfBirth"
        },
        {
          "component": "DisplayText",
          "title": "Gender",
          "id": "gender"
        },
        {
          "component": "DisplayText",
          "title": "Class",
          "id": "schoolClass"
        },
        {
          "component": "SchoolBlockWrapper",
          "title": "School",
          "id": "schoolId"
        },
        {
          "component": "RecentAttendanceBlocks",
          "title": "Attendance (School)",
          "id": "schoolAttendance",
          "config": {
            "filterByActivityType": "SCHOOL_CLASS"
          },
          "noSorting": true
        },
        {
          "component": "RecentAttendanceBlocks",
          "title": "Attendance (Coaching)",
          "id": "coachingAttendance",
          "config": {
            "filterByActivityType": "COACHING_CLASS"
          },
          "noSorting": true
        },
        {
          "component": "DisplayConfigurableEnum",
          "title": "Center",
          "id": "center"
        },
        {
          "component": "DisplayText",
          "title": "Status",
          "id": "status"
        },
        {
          "component": "DisplayDate",
          "title": "Admission",
          "id": "admissionDate"
        },
        {
          "component": "DisplayText",
          "title": "Mother Tongue",
          "id": "motherTongue"
        },
        {
          "component": "DisplayConfigurableEnum",
          "title": "Aadhar",
          "id": "has_aadhar"
        },
        {
          "component": "DisplayConfigurableEnum",
          "title": "Bank Account",
          "id": "has_bankAccount"
        },
        {
          "component": "DisplayConfigurableEnum",
          "title": "Kanyashree",
          "id": "has_kanyashree"
        },
        {
          "component": "DisplayConfigurableEnum",
          "title": "Ration Card",
          "id": "has_rationCard"
        },
        {
          "component": "DisplayConfigurableEnum",
          "title": "BPL Card",
          "id": "has_BplCard"
        },
        {
          "component": "DisplayText",
          "title": "Vaccination Status",
          "id": "health_vaccinationStatus"
        },
        {
          "component": "DisplayText",
          "title": "Blood Group",
          "id": "health_bloodGroup"
        },
        {
          "component": "DisplayText",
          "title": "Eye Status",
          "id": "health_eyeHealthStatus"
        },
        {
          "component": "DisplayDate",
          "title": "Last Eye Check-Up",
          "id": "health_lastEyeCheckup"
        },
        {
          "component": "DisplayDate",
          "title": "Last Dental Check-Up",
          "id": "health_lastDentalCheckup"
        },
        {
          "component": "DisplayDate",
          "title": "Last ENT Check-Up",
          "id": "health_lastENTCheckup"
        },
        {
          "component": "DisplayDate",
          "title": "Last Vitamin D",
          "id": "health_lastVitaminD"
        },
        {
          "component": "DisplayDate",
          "title": "Last De-Worming",
          "id": "health_lastDeworming"
        },
        {
          "component": "BmiBlock",
          "title": "BMI",
          "id": "health_BMI",
          "noSorting": true}
      ],
      "columnGroup": {
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
              "center"
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
              "gender",
              "age",
              "dateOfBirth",
              "center",
              "health_BMI",
              "health_vaccinationStatus",
              "health_bloodGroup",
              "health_eyeHealthStatus",
              "health_lastEyeCheckup",
              "health_lastDentalCheckup",
              "health_lastENTCheckup",
              "health_lastVitaminD",
              "health_lastDeworming"
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
          "label": "Center",
          "type": "configurable-enum",
          "enumId": "center",
          "display": "dropdown"
        },
        {
          "id": "school",
          "type": "prebuilt",
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
                  [
                    {
                      "input": "photo",
                      "id": "photo",
                      "placeholder": "Photo Filename"
                    }
                  ],
                  [
                    {
                      "input": "text",
                      "id": "name",
                      "placeholder": "Name",
                      "required": true
                    },
                    {
                      "input": "text",
                      "id": "projectNumber",
                      "placeholder": "Project Number"
                    },
                    {
                      "input": "configurable-enum-select",
                      "id": "center",
                      "placeholder": "Center",
                      "enumId": "center"
                    },
                    {
                      "input": "text",
                      "id": "status",
                      "placeholder": "Project Status"
                    }
                  ],
                  [
                    {
                      "input": "age",
                      "tooltip": "This field is read-only. Edit Date of Birth to change age. Select Jan 1st if you only know the year of birth.",
                      "id": "dateOfBirth",
                      "placeholder": "Date of Birth"
                    },
                    {
                      "input": "select",
                      "id": "gender",
                      "placeholder": "Gender",
                      "options": [
                        "M",
                        "F"
                      ]
                    },
                    {
                      "input": "text",
                      "id": "motherTongue",
                      "placeholder": "Mother Tongue"
                    },
                    {
                      "input": "text",
                      "id": "religion",
                      "placeholder": "Religion"
                    }
                  ],
                  [
                    {
                      "input": "datepicker",
                      "id": "admissionDate",
                      "placeholder": "Admission Date"
                    },
                    {
                      "input": "configurable-enum-select",
                      "id": "has_aadhar",
                      "placeholder": "Aadhar Status",
                      "enumId": "document-status"
                    },
                    {
                      "input": "configurable-enum-select",
                      "id": "has_kanyashree",
                      "placeholder": "Kanyashree Status",
                      "enumId": "document-status"
                    },
                    {
                      "input": "configurable-enum-select",
                      "id": "has_bankAccount",
                      "placeholder": "Bank Account Status",
                      "enumId": "document-status"
                    },
                    {
                      "input": "configurable-enum-select",
                      "id": "has_rationCard",
                      "placeholder": "Ration Card Status",
                      "enumId": "document-status"
                    },
                    {
                      "input": "configurable-enum-select",
                      "id": "has_BplCard",
                      "placeholder": "BPL Card Status",
                      "enumId": "document-status"
                    }
                  ],
                  [
                    {
                      "input": "text",
                      "id": "address",
                      "placeholder": "Address"
                    },
                    {
                      "input": "text",
                      "id": "phone",
                      "placeholder": "Phone No."
                    },
                    {
                      "input": "text",
                      "id": "guardianName",
                      "placeholder": "Guardians"
                    },
                    {
                      "input": "text",
                      "id": "preferredTimeForGuardianMeeting",
                      "placeholder": "Preferred time for guardians meeting"
                    }
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
                  { "id": "schoolId", "label": "School", "input": "school" },
                  { "id": "schoolClass", "label": "Class", "input": "text" },
                  { "id": "start", "label": "From", "input": "date" },
                  { "id": "end", "label": "To", "input": "date" },
                  { "id": "result", "label": "Result", "input": "percentageResult" },
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
                  [
                    {
                      "input": "select",
                      "id": "health_vaccinationStatus",
                      "placeholder": "Vaccination Status",
                      "options": [
                        "Good",
                        "Vaccination Due",
                        "Needs Checking",
                        "No Card/Information"
                      ]
                    }
                  ],
                  [
                    {
                      "input": "select",
                      "id": "health_eyeHealthStatus",
                      "placeholder": "Eye Status",
                      "options": [
                        "Good",
                        "Has Glasses",
                        "Needs Glasses",
                        "Needs Checkup"
                      ]
                    }
                  ],
                  [
                    {
                      "input": "text",
                      "id": "health_bloodGroup",
                      "placeholder": "Blood Group"
                    }
                  ],
                  [
                    {
                      "input": "datepicker",
                      "id": "health_lastDentalCheckup",
                      "placeholder": "Last Dental Check-Up"
                    }
                  ],
                  [
                    {
                      "input": "datepicker",
                      "id": "health_lastEyeCheckup",
                      "placeholder": "Last Eye Check-Up"
                    }
                  ],
                  [
                    {
                      "input": "datepicker",
                      "id": "health_lastENTCheckup",
                      "placeholder": "Last ENT Check-Up"
                    }
                  ],
                  [
                    {
                      "input": "datepicker",
                      "id": "health_lastVitaminD",
                      "placeholder": "Last Vitamin D"
                    }
                  ],
                  [
                    {
                      "input": "datepicker",
                      "id": "health_lastDeworming",
                      "placeholder": "Last De-Worming"
                    }
                  ]
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
                {
                  name: "date",
                  label: "Date",
                  inputType: ColumnDescriptionInputType.DATE
                },
                {
                  name: "isMotivatedDuringClass",
                  label: "Motivated",
                  inputType: ColumnDescriptionInputType.CONFIGURABLE_ENUM,
                  enumId: "rating-answer",
                  tooltip: "The child is motivated during the class."
                },
                {
                  name: "isParticipatingInClass",
                  label: "Participates",
                  inputType: ColumnDescriptionInputType.CONFIGURABLE_ENUM,
                  enumId: "rating-answer",
                  tooltip: "The child is actively participating in the class."
                },
                {
                  name: "isInteractingWithOthers",
                  label: "Interacts",
                  inputType: ColumnDescriptionInputType.CONFIGURABLE_ENUM,
                  enumId: "rating-answer",
                  tooltip: "The child interacts with other students during the class."
                },
                {
                  name: "doesHomework",
                  label: "Homework",
                  inputType: ColumnDescriptionInputType.CONFIGURABLE_ENUM,
                  enumId: "rating-answer",
                  tooltip: "The child does its homework."
                },
                {
                  name: "isOnTime",
                  label: "On time",
                  inputType: ColumnDescriptionInputType.CONFIGURABLE_ENUM,
                  enumId: "rating-answer",
                  tooltip: "The child is always on time for the class."
                },
                {
                  name: "asksQuestions",
                  label: "Asks",
                  inputType: ColumnDescriptionInputType.CONFIGURABLE_ENUM,
                  enumId: "rating-answer",
                  tooltip: "The child is asking questions during the class."
                },
                {
                  name: "listens",
                  label: "Listens",
                  inputType: ColumnDescriptionInputType.CONFIGURABLE_ENUM,
                  enumId: "rating-answer",
                  tooltip: "The child is listening during the class."
                },
                {
                  name: "canWorkOnBoard",
                  label: "Solves on board",
                  inputType: ColumnDescriptionInputType.CONFIGURABLE_ENUM,
                  enumId: "rating-answer",
                  tooltip: "The child can solve exercises on the board."
                },
                {
                  name: "isConcentrated",
                  label: "Concentrated",
                  inputType: ColumnDescriptionInputType.CONFIGURABLE_ENUM,
                  enumId: "rating-answer",
                  tooltip: "The child is concentrated during the class."
                },
                {
                  name: "doesNotDisturb",
                  label: "Not Disturbing",
                  inputType: ColumnDescriptionInputType.CONFIGURABLE_ENUM,
                  enumId: "rating-answer",
                  tooltip: "The child does not disturb the class."
                },
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
                  [
                    {
                      "input": "datepicker",
                      "id": "dropoutDate",
                      "placeholder": "Dropout Date"
                    }
                  ],
                  [
                    {
                      "input": "text",
                      "id": "dropoutType",
                      "placeholder": "Dropout Type"
                    }
                  ],
                  [
                    {
                      "input": "text",
                      "id": "dropoutRemarks",
                      "placeholder": "Dropout Remarks"
                    }
                  ]
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
      "addNew": "Add activity",
      "filterPlaceholder": "",
      "columns": [
        {
          "component": "DisplayText",
          "title": "Title",
          "id": "title"
        },
        {
          "component": "DisplayConfigurableEnum",
          "title": "Type",
          "id": "type"
        },
        {
          "component": "DisplayUsers",
          "title": "Assigned to",
          "id": "assignedTo"
        }
      ],
      "columnGroup": {
        "default": "All",
        "mobile": "All",
        "groups": [
          {
            "name": "All",
            "columns": [
              "title",
              "type",
              "assignedTo"
            ]
          }
        ]
      },
      "filters": [
      ]
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
                  [
                    {
                      "input": "text",
                      "id": "title",
                      "placeholder": "Title"
                    }
                  ],
                  [
                    {
                      "id": "type",
                      "input": "configurable-enum-select",
                      "enumId": "interaction-type",
                      "placeholder": "Type"
                    }
                  ],
                  [
                    {
                      "input": "entity-select",
                      "id": "assignedTo",
                      "entityType": "User",
                      "placeholder": "Add coordinator...",
                      "label": "Assigned to"
                    }
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
              "component": "ActivityParticipantsSection"
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
                {"label": "Male children", "query": `[*gender=${Gender.MALE}]`},
                {"label": "Female children", "query": `[*gender=${Gender.FEMALE}]`},
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
                    {"label": "Male children attending a governmental school", "query": `[*gender=${Gender.MALE}]`},
                    {"label": "Female children attending a governmental school", "query": `[*gender=${Gender.FEMALE}]`},
                  ]
                },
                {"label": "Private schools", "query": `[*privateSchool=true]`},
                {
                  "query": `[*privateSchool=true]:getRelated(${ChildSchoolRelation.ENTITY_TYPE}, schoolId)[*isActive=true].childId:addPrefix(${Child.ENTITY_TYPE}):unique:toEntities`,
                  "label": "Children attending a private school",
                  "aggregations": [
                    {"label": "Male children attending a private school", "query": `[*gender=${Gender.MALE}]`},
                    {"label": "Female children attending a private school", "query": `[*gender=${Gender.FEMALE}]`},
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
      {"name": "address", "schema": { "dataType": "string" } },
      {"name": "phone", "schema": { "dataType": "string" } },
      {"name": "guardianName", "schema": { "dataType": "string" } },
      {"name": "preferredTimeForGuardianMeeting", "schema": { "dataType": "string" } },
      {"name": "center", "schema":  { "dataType": "configurable-enum", "innerDataType": "center" }},
      {"name": "has_aadhar", "schema": { "dataType": "configurable-enum", "innerDataType": "document-status" } },
      {"name": "has_bankAccount", "schema": { "dataType": "configurable-enum", "innerDataType": "document-status" } },
      {"name": "has_kanyashree", "schema": { "dataType": "configurable-enum", "innerDataType": "document-status" } },
      {"name": "has_rationCard", "schema": { "dataType": "configurable-enum", "innerDataType": "document-status" } },
      {"name": "has_BplCard", "schema": { "dataType": "configurable-enum", "innerDataType": "document-status" } },
      {"name": "health_vaccinationStatus", "schema": { "dataType": "string" } },
      {"name": "health_bloodGroup", "schema": { "dataType": "string" } },
      {"name": "health_lastDentalCheckup", "schema": { "dataType": "Date" } },
      {"name": "health_lastEyeCheckup", "schema": { "dataType": "Date" } },
      {"name": "health_lastENTCheckup", "schema": { "dataType": "Date" } },
      {"name": "health_eyeHealthStatus", "schema": { "dataType": "string" } },
      {"name": "health_lastVitaminD", "schema": { "dataType": "Date" } },
      {"name": "health_lastDeworming", "schema": { "dataType": "Date" } }
    ]
  },
  "entity:School": {
    "permissions": {
    }
  },
  "entity:HistoricalEntityData": {
    "attributes": [
      {"name": "isMotivatedDuringClass", "schema": { "dataType": "configurable-enum", "innerDataType": "rating-answer"}},
      {"name": "isParticipatingInClass", "schema": { "dataType": "configurable-enum", "innerDataType": "rating-answer"}},
      {"name": "isInteractingWithOthers", "schema": { "dataType": "configurable-enum", "innerDataType": "rating-answer"}},
      {"name": "doesHomework", "schema": { "dataType": "configurable-enum", "innerDataType": "rating-answer"}},
      {"name": "isOnTime", "schema": { "dataType": "configurable-enum", "innerDataType": "rating-answer"}},
      {"name": "asksQuestions", "schema": { "dataType": "configurable-enum", "innerDataType": "rating-answer"}},
      {"name": "listens", "schema": { "dataType": "configurable-enum", "innerDataType": "rating-answer"}},
      {"name": "canWorkOnBoard", "schema": { "dataType": "configurable-enum", "innerDataType": "rating-answer"}},
      {"name": "isConcentrated", "schema": { "dataType": "configurable-enum", "innerDataType": "rating-answer"}},
      {"name": "doesNotDisturb", "schema": { "dataType": "configurable-enum", "innerDataType": "rating-answer"}},
    ]
  }
}
