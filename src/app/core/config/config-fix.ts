import { defaultAttendanceStatusTypes } from "./default-config/default-attendance-status-types";
import { defaultInteractionTypes } from "./default-config/default-interaction-types";
import { ColumnDescriptionInputType } from "../entity-components/entity-subrecord/column-description-input-type.enum";

// prettier-ignore
export const defaultConfig = {
  "navigationMenu": {
    "items": [
      {
        "name": $localize`Dashboard`,
        "icon": "home",
        "link": "/"
      },
      {
        "name": $localize`Children`,
        "icon": "child",
        "link": "/child"
      },
      {
        "name": $localize`Schools`,
        "icon": "university",
        "link": "/school"
      },
      {
        "name": $localize`Recurring Activities`,
        "icon": "calendar",
        "link": "/recurring-activity"
      },
      {
        "name": $localize`Record Attendance`,
        "icon": "calendar-check-o",
        "link": "/attendance/add/day"
      },
      {
        "name": $localize`Manage Attendance`,
        "icon": "table",
        "link": "/attendance"
      },
      {
        "name": $localize`Notes`,
        "icon": "file-text",
        "link": "/note"
      },
      {
        "name": $localize`Admin`,
        "icon": "wrench",
        "link": "/admin"
      },
      {
        "name": $localize`Users`,
        "icon": "user",
        "link": "/users"
      },
      {
        "name": $localize`Database Conflicts`,
        "icon": "wrench",
        "link": "/admin/conflicts"
      },
      {
        "name": $localize`Help`,
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
      "label": $localize`:Document status OK|'A copy is with us':OK (copy with us)`
    },
    {
      "id": "OK (copy needed for us)",
      "label": $localize`:Document status OD|'A copy is needed':OK (copy needed for us)`
    },
    {
      "id": "needs correction",
      "label": $localize`:Document needs correction:needs correction`
    },
    {
      "id": "applied",
      "label": $localize`:Document is applied:applied`
    },
    {
      "id": "doesn't have",
      "label": $localize`:Has none|For example doesn't have an Aadhar document:doesn't have`
    },
    {
      "id": "not eligible",
      "label": $localize`:Document is not eligible:not eligible`
    }
  ],
  "enum:center": [
    {
      "id": "alipore",
      "label": $localize`Alipore`
    },
    {
      "id": "tollygunge",
      "label": $localize`Tollygunge`
    },
    {
      "id": "barabazar",
      "label": $localize`Barabazar`
    }
  ],
  "enum:rating-answer": [
    {
      id: "noAnswerPossible",
      label: $localize`no answer possible`,
    },
    {
      id: "notTrueAtAll",
      label: $localize`not true at all`,
    },
    {
      id: "rarelyTrue",
      label: $localize`rarely true`,
    },
    {
      id: "usuallyTrue",
      label: $localize`usually true`,
    },
    {
      id: "absolutelyTrue",
      label: $localize`absolutely true`,
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
                "label": $localize`:Record Attendance Button:Record Attendance`,
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
            "periodLabel": $localize`:Label showing events since last week:last week`
          }
        },
        {
          "component": "AttendanceWeekDashboard",
          "config": {
            "daysOffset": 7,
            "periodLabel": $localize`:Label showing events since last week:this week`
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
      "title": $localize`:General notes and reports|mostly regarding some children:Notes & Reports`,
      "includeEventNotes": false,
      "showEventNotesToggle": true,
      "columns": [
        {
          "component": "DisplayDate",
          "title": $localize`Date`,
          "id": "date"
        },
        {
          "component": "DisplayText",
          "title": $localize`:Subject of a Note or report:Subject`,
          "id": "subject"
        },
        {
          "component": "DisplayConfigurableEnum",
          "title": $localize`:Category of a Note or report:Category`,
          "id": "category"
        },
        {
          "component": "DisplayUsers",
          "title": $localize`:Author of a note or report:Author`,
          "id": "authors"
        },
        {
          "component": "ChildBlockList",
          "title": $localize`Children`,
          "id": "children",
          "noSorting": true
        }
      ],
      "columnGroup": {
        "default": $localize`:Column group|How a column should be displayed - Standard or Mobile:Standard`,
        "mobile": $localize`:Column group|How a column should be displayed - Standard or Mobile:Mobile`,
        "groups": [
          {
            "name": $localize`Standard`,
            "columns": [
              "date",
              "subject",
              "category",
              "authors",
              "children"
            ]
          },
          {
            "name": $localize`Mobile`,
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
          "label": $localize`Category`,
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
      "title": $localize`:List of all schools:Schools List`,
      "columns": [
        {
          "component": "DisplayText",
          "title": $localize`:The name of the school:Name`,
          "id": "name"
        },
        {
          "component": "DisplayText",
          "title": $localize`:Medium of Instruction|E.g. English, Hindi, e.t.c:Medium`,
          "id": "medium"
        },
        {
          "component": "DisplayCheckmark",
          "title": $localize`:Indicating that this is a private school:Private School`,
          "id": "privateSchool"
        },
        {
          "component": "DisplayText",
          "title": $localize`:The academic board of this school:Board`,
          "id": "academicBoard"
        },
        {
          "component": "DisplayText",
          "title": $localize`:The class up to where this school goes:Up to class`,
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
          "true": $localize`Private School`,
          "false": $localize`Government School`,
          "all": $localize`:All schools:All`
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
          "title": $localize`:Basic Information of a School:Basic Information`,
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
                      "placeholder": $localize`Name`
                    }
                  ],
                  [
                    {
                      "input": "text",
                      "id": "medium",
                      "placeholder": $localize`:Medium of Instruction|E.g. English, Hindi, e.t.c:Medium`
                    }
                  ],
                  [
                    {
                      "input": "checkbox",
                      "id": "privateSchool",
                      "placeholder": $localize`Private School`
                    }
                  ],
                  [
                    {
                      "input": "text",
                      "id": "academicBoard",
                      "placeholder": $localize`:The academic board of this school:Board`
                    }
                  ],
                  [
                    {
                      "input": "text",
                      "id": "phone",
                      "placeholder": $localize`:Contact Number of a school:Contact Number`
                    }
                  ],
                  [
                    {
                      "input": "text",
                      "id": "address",
                      "placeholder": $localize`:Address of a school:Address`
                    }
                  ],
                  [
                    {
                      "input": "text",
                      "id": "website",
                      "placeholder": $localize`:Website of a school:Website`
                    }
                  ],
                  [
                    {
                      "input": "text",
                      "id": "timing",
                      "placeholder": $localize`:Times that the school is open:School Timing`
                    }
                  ],
                  [
                    {
                      "input": "text",
                      "id": "workingDays",
                      "placeholder": $localize`:Working days of a school|E.g. Mon-Fri:Working Days`
                    }
                  ],
                  [
                    {
                      "input": "text",
                      "id": "upToClass",
                      "placeholder": $localize`:Maximum class this school teaches:Teaching up to class`
                    }
                  ],
                  [
                    {
                      "input": "textarea",
                      "id": "remarks",
                      "placeholder": $localize`:Additional remarks concerning a school:Remarks`
                    }
                  ]
                ]
              }
            }
          ]
        },
        {
          "title": $localize`:Students section of a school:Students`,
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
      "title": $localize`:List of all children managed:Children List`,
      "columns": [
        {
          "component": "DisplayText",
          "title": $localize`:Project number of a child:PN`,
          "id": "projectNumber"
        },
        {
          "component": "ChildBlock",
          "title": $localize`:Name of a child:Name`,
          "id": "name"
        },
        {
          "component": "DisplayText",
          "title": $localize`:Age of a child:Age`,
          "id": "age"
        },
        {
          "component": "DisplayDate",
          "title": $localize`:Date of birth of a child:DoB`,
          "id": "dateOfBirth"
        },
        {
          "component": "DisplayText",
          "title": $localize`:Gender of a child:Gender`,
          "id": "gender"
        },
        {
          "component": "DisplayText",
          "title": $localize`:Class a child attends:Class`,
          "id": "schoolClass"
        },
        {
          "component": "SchoolBlockWrapper",
          "title": $localize`:School a child attends:School`,
          "id": "schoolId"
        },
        {
          "component": "RecentAttendanceBlocks",
          "title": $localize`:Attendance at school:Attendance (School)`,
          "id": "schoolAttendance",
          "config": {
            "filterByActivityType": "SCHOOL_CLASS"
          },
          "noSorting": true
        },
        {
          "component": "RecentAttendanceBlocks",
          "title": $localize`:Attendance at coaching lessons:Attendance (Coaching)`,
          "id": "coachingAttendance",
          "config": {
            "filterByActivityType": "COACHING_CLASS"
          },
          "noSorting": true
        },
        {
          "component": "DisplayConfigurableEnum",
          "title": $localize`:The center of a child:Center`,
          "id": "center"
        },
        {
          "component": "DisplayText",
          "title": $localize`:The status of a child:Status`,
          "id": "status"
        },
        {
          "component": "DisplayDate",
          "title": $localize`:The admission date of a child:Admission`,
          "id": "admissionDate"
        },
        {
          "component": "DisplayText",
          "title": $localize`:The mother tongue of a child:Mother Tongue`,
          "id": "motherTongue"
        },
        {
          "component": "DisplayConfigurableEnum",
          "title": $localize`:Aadhar status of a child:Aadhar`,
          "id": "has_aadhar"
        },
        {
          "component": "DisplayConfigurableEnum",
          "title": $localize`:Bank account details of a child:Bank Account`,
          "id": "has_bankAccount"
        },
        {
          "component": "DisplayConfigurableEnum",
          "title": $localize`:Kanyashree status of a child:Kanyashree`,
          "id": "has_kanyashree"
        },
        {
          "component": "DisplayConfigurableEnum",
          "title": $localize`:Ration Card status of a child:Ration Card`,
          "id": "has_rationCard"
        },
        {
          "component": "DisplayConfigurableEnum",
          "title": $localize`:BPL Card status of a child:BPL Card`,
          "id": "has_BplCard"
        },
        {
          "component": "DisplayText",
          "title": $localize`:Vaccination status of a child:Vaccination Status`,
          "id": "health_vaccinationStatus"
        },
        {
          "component": "DisplayText",
          "title": $localize`:Blood group of a child:Blood Group`,
          "id": "health_bloodGroup"
        },
        {
          "component": "DisplayText",
          "title": $localize`:Eye status of a child:Eye Status`,
          "id": "health_eyeHealthStatus"
        },
        {
          "component": "DisplayDate",
          "title": $localize`:Date of the last eye check-up:Last Eye Check-Up`,
          "id": "health_lastEyeCheckup"
        },
        {
          "component": "DisplayDate",
          "title": $localize`:Date of the last dental check-up:Last Dental Check-Up`,
          "id": "health_lastDentalCheckup"
        },
        {
          "component": "DisplayDate",
          "title": $localize`:Date of the last ENT check-up:Last ENT Check-Up`,
          "id": "health_lastENTCheckup"
        },
        {
          "component": "DisplayDate",
          "title": $localize`:Dtae of the last vitamin D checking:Last Vitamin D`,
          "id": "health_lastVitaminD"
        },
        {
          "component": "DisplayDate",
          "title": $localize`:Date of the last de-worming:Last De-Worming`,
          "id": "health_lastDeworming"
        },
        {
          "component": "BmiBlock",
          "title": $localize`:BMI information about a child:BMI`,
          "id": "health_BMI",
          "noSorting": true}
      ],
      "columnGroup": {
        "default": $localize`:Column group:School Info`,
        "mobile": $localize`Mobile`,
        "groups": [
          {
            "name": $localize`:Shows basic infos about children:Basic Info`,
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
            "name": $localize`:Shows school info about children:School Info`,
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
            "name": $localize`:Shows info about statuses, such as Aadhar, Bank account, e.t.c of children:Status`,
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
            "name": $localize`:Shows info about health statuses of children:Health`,
            "columns": [
              "projectNumber",
              "name",
              "center",
              "health_BMI",
              "health_vaccinationStatus",
              "health_bloodGroup",
              "health_eyeHealthStatus",
              "health_lastEyeCheckup",
              "health_lastDentalCheckup",
              "health_lastENTCheckup",
              "health_lastVitaminD",
              "health_lastDeworming",
              "gender",
              "age",
              "dateOfBirth"
            ]
          },
          {
            "name": $localize`Mobile`,
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
          "true": $localize`:show only active children:Active Children`,
          "false": $localize`:show only inactive children:Inactive`,
          "all": $localize`:show all children:All`
        },
        {
          "id": "center",
          "label": $localize`:The center a child lives in:Center`,
          "type": "configurable-enum",
          "enumId": "center",
          "display": "dropdown"
        },
        {
          "id": "school",
          "label": $localize`School`,
          "type": "prebuilt",
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
          "title": $localize`:Basic information of a child:Basic Information`,
          "components": [
            {
              "title": "",
              "component": "Form",
              "config": {
                "cols": [
                  [
                    {
                      "input": "photo",
                      "id": "photoFile",
                      "placeholder": $localize`:Placeholder when a children's photo can't be loaded:Photo Filename`
                    }
                  ],
                  [
                    {
                      "input": "text",
                      "id": "name",
                      "placeholder": $localize`:The name of a child:Name`,
                      "required": true
                    },
                    {
                      "input": "text",
                      "id": "projectNumber",
                      "placeholder": $localize`:The project number of a child:Project Number`
                    },
                    {
                      "input": "configurable-enum-select",
                      "id": "center",
                      "placeholder": $localize`:The center a child lives in:Center`,
                      "enumId": "center"
                    },
                    {
                      "input": "text",
                      "id": "status",
                      "placeholder": $localize`:The project status of a child:Project Status`
                    }
                  ],
                  [
                    {
                      "input": "age",
                      "tooltip": "This field is read-only. Edit Date of Birth to change age. Select Jan 1st if you only know the year of birth.",
                      "id": "dateOfBirth",
                      "placeholder": $localize`:The date of birth of a child:Date of Birth`
                    },
                    {
                      "input": "select",
                      "id": "gender",
                      "placeholder": $localize`:The gender of a child:Gender`,
                      "options": [
                        $localize`:gender male (short form):M`,
                        $localize`:gender female (short form):F`
                      ]
                    },
                    {
                      "input": "text",
                      "id": "motherTongue",
                      "placeholder": $localize`:The mother tongue of a child:Mother Tongue`
                    },
                    {
                      "input": "text",
                      "id": "religion",
                      "placeholder": $localize`:The religion of a child:Religion`
                    }
                  ],
                  [
                    {
                      "input": "datepicker",
                      "id": "admissionDate",
                      "placeholder": $localize`:The admission date of a child:Admission Date`
                    },
                    {
                      "input": "configurable-enum-select",
                      "id": "has_aadhar",
                      "placeholder": $localize`:The aadhar status of a child:Aadhar Status`,
                      "enumId": "document-status"
                    },
                    {
                      "input": "configurable-enum-select",
                      "id": "has_kanyashree",
                      "placeholder": $localize`:The kanyashree status of a child:Kanyashree Status`,
                      "enumId": "document-status"
                    },
                    {
                      "input": "configurable-enum-select",
                      "id": "has_bankAccount",
                      "placeholder": $localize`:The bank account status of a child:Bank Account Status`,
                      "enumId": "document-status"
                    },
                    {
                      "input": "configurable-enum-select",
                      "id": "has_rationCard",
                      "placeholder": $localize`:The ration card status of a child:Ration Card Status`,
                      "enumId": "document-status"
                    },
                    {
                      "input": "configurable-enum-select",
                      "id": "has_BplCard",
                      "placeholder": $localize`:The bpl status of a child:BPL Card Status`,
                      "enumId": "document-status"
                    }
                  ],
                  [
                    {
                      "input": "text",
                      "id": "address",
                      "placeholder": $localize`:The address of a child:Address`
                    },
                    {
                      "input": "text",
                      "id": "phone",
                      "placeholder": $localize`:The phone number of a child:Phone No.`
                    },
                    {
                      "input": "text",
                      "id": "guardianName",
                      "placeholder": $localize`:The names of the guardians of a child|School context:Guardians`
                    },
                    {
                      "input": "text",
                      "id": "preferredTimeForGuardianMeeting",
                      "placeholder": $localize`Preferred time for guardians meeting`
                    }
                  ]
                ]
              }
            }
          ]
        },
        {
          "title": $localize`:Education subsection of a child:Education`,
          "components": [
            {
              "title": $localize`:School history of a child:School History`,
              "component": "PreviousSchools",
              "config": {
                "single": true,
                "columns": [
                  { "id": "schoolId", "label": $localize`School`, "input": "school" },
                  { "id": "schoolClass", "label": $localize`Class`, "input": "text" },
                  { "id": "start", "label": $localize`From`, "input": "date" },
                  { "id": "end", "label": $localize`To`, "input": "date" },
                  { "id": "result", "label": $localize`Result`, "input": "percentageResult" },
                ],
              }
            },
            {
              "title": $localize`:ASER results of a child:ASER Results`,
              "component": "Aser"
            }
          ]
        },
        {
          "title": $localize`:Information about the attendance of a child:Attendance`,
          "components": [
            {
              "title": "",
              "component": "GroupedChildAttendance"
            }
          ]
        },
        {
          "title": $localize`:Notes and reports linked to a child:Notes & Reports`,
          "components": [
            {
              "title": "",
              "component": "NotesOfChild"
            }
          ]
        },
        {
          "title": $localize`:Health information of a child:Health`,
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
                      "placeholder": $localize`:The vaccination status of a child:Vaccination Status`,
                      "options": [
                        $localize`:Vaccination status is good:Good`,
                        $localize`:Vaccination status is due:Vaccination Due`,
                        $localize`:Vaccination status needs checking:Needs Checking`,
                        $localize`:No information about a vaccination status:No Card/Information`
                      ]
                    }
                  ],
                  [
                    {
                      "input": "select",
                      "id": "health_eyeHealthStatus",
                      "placeholder": $localize`:Eye-sight status of a child:Eye Status`,
                      "options": [
                        $localize`:Eye sight status is good:Good`,
                        $localize`:Eye sight status indicating child has glasses:Has Glasses`,
                        $localize`:Eye sight status indicating child needs glasses:Needs Glasses`,
                        $localize`:Eye sight status indicating child needs check-up:Needs Checkup`
                      ]
                    }
                  ],
                  [
                    {
                      "input": "text",
                      "id": "health_bloodGroup",
                      "placeholder": $localize`:The blood-group of a child:Blood Group`
                    }
                  ],
                  [
                    {
                      "input": "datepicker",
                      "id": "health_lastDentalCheckup",
                      "placeholder": $localize`:Last dental check-up date:Last Dental Check-Up`
                    }
                  ],
                  [
                    {
                      "input": "datepicker",
                      "id": "health_lastEyeCheckup",
                      "placeholder": $localize`:Last Eye Check-up date:Last Eye Check-Up`
                    }
                  ],
                  [
                    {
                      "input": "datepicker",
                      "id": "health_lastENTCheckup",
                      "placeholder": $localize`:Last ENT date:Last ENT Check-Up`
                    }
                  ],
                  [
                    {
                      "input": "datepicker",
                      "id": "health_lastVitaminD",
                      "placeholder": $localize`:Last Vitamin-D date:Last Vitamin D`
                    }
                  ],
                  [
                    {
                      "input": "datepicker",
                      "id": "health_lastDeworming",
                      "placeholder": $localize`:Last child de-worming date:Last De-Worming`
                    }
                  ]
                ]
              }
            },
            {
              "title": $localize`:Height & Weight tracking title:Height & Weight Tracking`,
              "component": "HealthCheckup"
            }
          ]
        },
        {
          "title": $localize`:Education materials of a child title:Educational Materials`,
          "components": [
            {
              "title": "",
              "component": "EducationalMaterial"
            }
          ]
        },
        {
          title: $localize`Observations`,
          components: [
            {
              title: "",
              component: "HistoricalDataComponent",
              config: [
                {
                  name: "date",
                  label: $localize`Date`,
                  inputType: ColumnDescriptionInputType.DATE
                },
                {
                  name: "isMotivatedDuringClass",
                  label: $localize`Motivated`,
                  inputType: ColumnDescriptionInputType.CONFIGURABLE_ENUM,
                  enumId: "rating-answer",
                  tooltip: $localize`The child is motivated during the class.`
                },
                {
                  name: "isParticipatingInClass",
                  label: $localize`Participates`,
                  inputType: ColumnDescriptionInputType.CONFIGURABLE_ENUM,
                  enumId: "rating-answer",
                  tooltip: $localize`The child is actively participating in the class.`
                },
                {
                  name: "isInteractingWithOthers",
                  label: $localize`Interacts`,
                  inputType: ColumnDescriptionInputType.CONFIGURABLE_ENUM,
                  enumId: "rating-answer",
                  tooltip: $localize`The child interacts with other students during the class.`
                },
                {
                  name: "doesHomework",
                  label: $localize`Homework`,
                  inputType: ColumnDescriptionInputType.CONFIGURABLE_ENUM,
                  enumId: "rating-answer",
                  tooltip: $localize`The child does its homework.`
                },
                {
                  name: "isOnTime",
                  label: $localize`On time`,
                  inputType: ColumnDescriptionInputType.CONFIGURABLE_ENUM,
                  enumId: "rating-answer",
                  tooltip: $localize`The child is always on time for the class.`
                },
                {
                  name: "asksQuestions",
                  label: $localize`:Ask questions|A child is asking questions during the class:Asks`,
                  inputType: ColumnDescriptionInputType.CONFIGURABLE_ENUM,
                  enumId: "rating-answer",
                  tooltip: $localize`The child is asking questions during the class.`
                },
                {
                  name: "listens",
                  label: $localize`Listens`,
                  inputType: ColumnDescriptionInputType.CONFIGURABLE_ENUM,
                  enumId: "rating-answer",
                  tooltip: $localize`The child is listening during the class.`
                },
                {
                  name: "canWorkOnBoard",
                  label: $localize`Solves on board`,
                  inputType: ColumnDescriptionInputType.CONFIGURABLE_ENUM,
                  enumId: "rating-answer",
                  tooltip: $localize`The child can solve exercises on the board.`
                },
                {
                  name: "isConcentrated",
                  label: $localize`Concentrated`,
                  inputType: ColumnDescriptionInputType.CONFIGURABLE_ENUM,
                  enumId: "rating-answer",
                  tooltip: $localize`The child is concentrated during the class.`
                },
                {
                  name: "doesNotDisturb",
                  label: $localize`Not Disturbing`,
                  inputType: ColumnDescriptionInputType.CONFIGURABLE_ENUM,
                  enumId: "rating-answer",
                  tooltip: $localize`The child does not disturb the class.`
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
                      "placeholder": $localize`:The date a child dropped out:Dropout Date`
                    }
                  ],
                  [
                    {
                      "input": "text",
                      "id": "dropoutType",
                      "placeholder": $localize`:The type of dropout (can be anything):Dropout Type`
                    }
                  ],
                  [
                    {
                      "input": "text",
                      "id": "dropoutRemarks",
                      "placeholder": $localize`:Additional remarks concerning the dropout of a child:Dropout Remarks`
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
      "title": $localize`Recurring Activities`,
      "columns": [
        {
          "component": "DisplayText",
          "title": $localize`:Title of a recurring activity:Title`,
          "id": "title"
        },
        {
          "component": "DisplayConfigurableEnum",
          "title": $localize`:Type of a recurring activity:Type`,
          "id": "type"
        },
        {
          "component": "DisplayUsers",
          "title": $localize`:The people (users) this recurring activity is assigned to:Assigned to`,
          "id": "assignedTo"
        }
      ],
      "columnGroup": {
        "default": $localize`:Show all entries of a kind :All`,
        "mobile": $localize`All`,
        "groups": [
          {
            "name": $localize`All`,
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
          "title": $localize`:Details of a recurring activity:Activity`,
          "components": [
            {
              "component": "Form",
              "config": {
                "cols": [
                  [
                    {
                      "input": "text",
                      "id": "title",
                      "placeholder": $localize`:The title of a recurring activity:Title`
                    }
                  ],
                  [
                    {
                      "id": "type",
                      "input": "configurable-enum-select",
                      "enumId": "interaction-type",
                      "placeholder": $localize`:The type of a recurring activity:Type`
                    }
                  ]
                ]
              }
            }
          ]
        },
        {
          "title": $localize`:The participants of a recurring activity|Schools and Children:Participants`,
          "components": [
            {
              "component": "ActivityParticipantsSection"
            }
          ]
        },
        {
          "title": $localize`:Events and attendance title:Events & Attendance`,
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
