# Configuration System
The config is a json object containing information about how the user interface for a specific project is displayed.
The config is stored in the database and can be updated for a user without changing the code base.
The default config is part of the repository in the [config-fix.json file](https://github.com/Aam-Digital/ndb-core/tree/master/src/app/core/config/config-fix.json).

Config data is loaded by the `ConfigService` and then distributed to the relevant modules.
This document aims to explain how cofiguration defines the rest of the application and all options that can be changed through the config.

-----
<!-- TOC -->

- [Config Service](#config-service)
    - [Storing config in DB](#storing-config-in-db)
- [Config File](#config-file)
    - [Navigation Menu](#navigation-menu)
    - [Views](#views)
    - [Entity](#entity)
    - [Option Lists](#option-lists)
- [Full Example](#example)

<!-- /TOC -->
-----

## Config Service

![](../../images/config_service.png)

The [ConfigService](../../injectables/ConfigService.html) is an Angular service that you can inject anywhere in the code if you need to access configuration values.
It loads the configuration from the database (or the default file if no entry is available) first thing when starting the application.

Some core services use the ConfigService to dynamically set up parts of the application on startup.
For example the [NavigationItemsService](../../injectables/NavigationItemsService.html) creates the menu items as configured
and the [RouterService](../../injectables/RouterService.html) sets up Angular routing defining what components users see.
The config service provides a behavior subject which will notify all subscribers when a new configuration was uploaded.
This can be used for core tasks like setting up the routes or creating the navigation bar.

Top-level "view" components (i.e. components that are used to define a whole page, not just some building block for a part or section)
receive their config data through the standard Angular router and can access it by injecting `ActivatedRoute`.


### Storing config in DB
Config is currently stored in the normal app database with the fixed _id `"_id": "Config:CONFIG_ENTITY"`.
This document in the database has to contain a single property `data` that holds the config object whose parts are described here.

Example:
```
{
  "_id": "Config:CONFIG_ENTITY",
  "data": {
    "navigationMenu": {
      "items": [ ...],
    }
    ...
  }
}
```

Uploading and downloading the configuration can be done by admins inside the admin view.

-----
## Config File

The config file is a json object containing information about what and how things are displayed in the application.
On the top level of the config file, there are four different kinds of entries:

1. The main navigation menu (`navigationMenu`)
1. Views defining the UI of each page (`view:<path>`)
1. Lists of select options for dropdown fields (`enum:<category-id>`, including available Note categories, etc.)
1. Entity configuration to define [schemas](entity-schema-system.md) or permissions  (`entity:<entity-id>`)


### Navigation Menu
The top level entry `navigationMenu` builds the visible and clickable items for the navigation menu on the left hand side of the app. Right now, the `navigationMenu` has the only subentry `items`. `items` contains an array of objects, each object representing one item within the navigation menu. The order of the entries reflects how the navigation menu items are shown in the app.

Each navigation menu item object has to have the three properties `name`, `icon` and `link`. `name` hold the inscription of the item in the navigation menu in the app, `icon` indicates the little icon picture that is shown before the textual inscription of the item in the navigation menu and `link` contains the URL or view that the user is directed to when clicking on the navigation menu item. For every link given, there necessarily has to be a corresponding view-entry on the top level of the config file.

Example:
```
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
        ...
        {
            "name": "Help",
            "icon": "question-circle",
            "link": "/help"
        }
    ]
  },
```


### Views
The largest part of the config file are the views. Each view entry starts with `view:`.
The part that comes after the colon is what comes after the top level / in the URL of the app.
There has to be one view entry with nothing after the colon, thus directing to the root path that is used as a default one when the user opens the app.
Paths can have multiple parts, e.g. `view:admin/conflicts`.
If we append `:id`, then this is used as a parameter directly from the app, e.g. `view:child/:id` is the path for the child details view where the app provides the child entity id to be viewed to the component.

The only mandatory field for each view is `"component":` telling the app which component to use for the respective view.
The component part has to refer to an existing angular component within the app.
Components currently have to be registered additionally in the [COMPONENT_MAP](../../miscellaneous/variables.html#COMPONENT_MAP).

The two optional fields of each view are `"config":` and `"requiresAdmin":`. The latter is a boolean telling the app whether the user has to be logged in as an administrator in order to be able the see the component. 

What comes within the `"config":` object depends on the component being used.
The Dashboard-Component for example takes as `"widgets:"` an array of subcomponents, where every entry has to have a `"component:"` and may have an own `"config:"` object.
(This "config" is passed to the component, which receives and handles it by implementing the [OnInitDynamicComponent](../../interfaces/OnInitDynamicComponent.html) interface)

Example:

```
"view:": {
    "component": "Dashboard",
    "config": {
      "widgets": [
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
        ...
```

#### List components
List components showing data in a table (such as ChildrenList oder SchoolsList) usually have the four config objects `"title"`, `"columns"`, `"columnGroup"` (optional) and `"filters"` (optional).
(These are implemented by the [EntityListComponent](../../components/EntityListComponent.html).)

The `"title"` is the text shown in the heading of the component.

`"columns"` contains an array of the columns to be displayed. Each column-entry has the three fields `"component"`, `"title"` and `"id"`.

Example:
```
"view:child": {
    "component": "ChildrenList",
    "config": {
        "title": "Children List",
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
            }
            ...
```

The `"columnGroup"` object holds the three properties `"default"`, `"mobile"` and `"groups"`.
`"default"` and `"mobile"` hold the names of the group of columns being displayed by default or on a mobile device.
If the `"columnGroup"` property is not defined, all columns will be displayed.
If `"default"` or `"mobile"` is not defined, the first entry of `"groups"` will be used.
`"groups"` consists of an array of groups of columns, where every entry has a `"name"` and an array of column names within `"columns"`.

Example:
```
        "columnGroup": {
            "default": "School Info",
            "mobile": "Mobile",
            "groups": [
            {
                "name": "Basic Info",
                "columns": [
                    "projectNumber",
                    "name",
                    ...
                    "status"
                ]
            },
            {
                "name": "School Info",
                "columns": [
                    "projectNumber",
                    "name",
                    ...
                ]
            },

```

The object `"filters"` within the config of a list component can be used to create filter options for the list data.
Currently, three types of filters exist: default, boolean and prebuilt.
For default and boolean filters, the `"id"` field refers to an attribute of the entity which is displayed in the list.
The default filter only requires the field `"id"` and will provide filter options for all possible values of this property.
A boolean filter can be specified with `"type": "boolean"` and requires the fields `"id"`, `"default"`, `"true"`, `"false"` and `"all"` to be set.
This will create a filter for boolean values with three buttons (`all`, `true`, `false`).
The names of these buttons can be specified using the `"true"`, `"false"` and `"all"` option.
The `"default"` options defines which button should be active on default and has to be `""`, `"true"` or `"false"`.
The prebuilt option is used to enable or disable filters that contain more logic and are implemented inside the component which is displayed.
This option requires the fields `"type"` and `"id"`, where `"id"` matched the `id` of a prebuilt filter inside a component.

Example:
```
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
                },
                {
                  "id": "date",
                  "type": "prebuilt"
                },
        ]
```

#### Detail components
Detail components can show data of a single entity presented in multiple sections and forms.
(These are implemented by the [EntityDetailsModule](../../modules/EntityDetailsModule.html), in particular the [EntityDetailsComponent](../../components/EntityDetailsComponent.html).)

You can find details on the config format and its sub-sections from API reference section: [EntityDetailsConfig](../../classes/EntityDetailsConfig.html)

The detail component requires three attributes: `"icon"`, `"entity"` and `"panels"`.
`"icon"` indicates a little icon that will be rendered on the top of the page.
`"entity"` expects the name of an entity for which the details page should be created. 
This has to match exactly the name of the entity defined by the `@DatabaseEntity()` annotation.
The entity will then be loaded using the entity name and the id which is read from the URL.
The `"panels"` field expects an array of panel definitions.
Each panel has a `"title"` and an array of `"components"`.
The component configuration requires another `"title"`, the `"component"` that should be rendered (the component has to be defined here [OnInitDynamicComponent](../../interfaces/OnInitDynamicComponent.html)) and a configuration (`"config"`) which is passed to this component.
```
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
              "config": { }
            }
          ]
        },
        {
          "title": "Education",
          "components": [
            {
              "title": "SchoolHistory",
              "component": "PreviousSchools"
            },
            {
              "title": "ASER Results",
              "component": "Aser"
            }
          ]
        }
      ]
    }
```

#### The Form Component
The form component is a flexible component that can be used inside the details component.
It allows to dynamically create a form through configuration.
The configuration for this component expects a single field, the `"cols"`.
This field should be a two dimensional array where the first dimension defines what is rendered next to each other (the columns), and the second dimension what is rendered in each column.
If all fields are the same height, then every field can be defined as a column.
The inner object can have the following but not always required fields: `"input"`, `"id"`, `"placeholder"`, `"required"`, `"options"` and `"enumId"`.
`"input"` defines which input type should be used.
`"id"` defines the entity attribute which should be displayed and modified.
`"placeholder"` defines a value that is displayed if no value is present.
`"required"` specifies whether a value is required, default is `false`.
`"options"` is only required when `"input": "select"` and defines the available select options.
`"enumId"` is only required when `"input": "configurable-enum-select"` and refers to the config id of the enum that should be used for the select options.

```
  "config": {
    "cols": [
      [
        {
          "input": "photo",
          "id": "photoFile",
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
        }
      ],
      [
        {
          "input": "age"
        },
        {
          "input": "datepicker",
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
          ],
        },
        {
          "input": "configurable-enum-select",
          "id": "has_aadhar",
          "placeholder": "Aadhar Status",
          "enumId": "document-status"
        },
      ]
    ]
  }
```

### Entity
The entity object within the config file can be used to extend and configure existing entities.
The name of the entity to which this config refers comes ofter the colon in this case `"child"`.

#### Attributes
The attribute field allows to add attributes to an entity:
Each attribute requires a `"name"` and a `"schema"` which refers to the entity [schemas](entity-schema-system.md).

Example:
```
"entity:Child": {
    "attributes": [
        {"name": "address", "schema": { "dataType": "string" } },
        {"name": "phone", "schema": { "dataType": "string" } },
        ...
        {"name": "health_lastDeworming", "schema": { "dataType": "Date" } }
    ]
}

```

#### Permissions
Permissions for interaction on entities can be given or denied using the config.
This will disable buttons in the app to create, delete or edit entities if the user is not permitted.

The following example will only allow `admin` users to create, edit and delete `School` objects:
```
"entity:School": {
  "permissions": {
    "create": ["admin"],
    "update": ["admin"],
    "delete": ["admin"]
  }
}
```
Buttons can be marked as part of an interaction using the `appEntityInteraction` directive:
```
<button
  (click)="switchEdit()"
  [appEntityOperation]="{entity: entity?.getConstructor(), operation: operationType.UPDATE}"
>Edit</button>
```
This will disable the button if the current user is not allowed to perform the update operation on the given entity.

### Option Lists
Option lists or `ConfigurableEnumValue`s can provide a pre-set list of options for a field
to allow users to easily select an option from a dropdown and ensure that users are not entering random, invalid values.

Config entries for this purpose have a prefix `enum:` followed by an id you can freely define (e.g. `enum:project-status`).

The value is an array of objects defining the options. Mandatory fields for each option are `"id"` and `"label"`.
`"id"` should be written in uppercase letters without spaces (user underscore _ instead).
The `"id"` should always stay the same as it is written to the database and identifies the value even if you rename the label shown to users.
`"label"` holds the human-readable text for the dropdown entry or wherever the value is shown to the user.
This text may be changed without any negative effect to data consistency and the change will instantly be visible in all saved entries of this type.

Example:
```
"enum:project-status": [
    {
        "id": "ACTIVE",
        "label": "active"
    },
    {
        "id": "COMPLETED",
        "label": "completed the programme"
    },
    {
        "id": "DROPPED",
        "label": "dropped out of the programme"
    }
}
```

#### Defining configurable enum properties

In order to use such an "enum" in entity fields, you need to set the schema datatype and the form type in the according config objects:

In the entity, set the dataType to "configurable-enum" and the "innerDataType" to the id of the enum config:
```
"entity:Child": {
  {"name": "status", "schema": { "dataType": "configurable-enum", "innerDataType": "project-status"  } }
  ...
```

#### Display a configurable enum property in the list view

In the List View columns config, use the "DisplayConfigurableEnum" component for the field:
```
"columns": [
  {
    "component": "DisplayConfigurableEnum",
    "title": "Status",
    "id": "status"
  },
  ...
]
```

#### Display a configurable enum property in the details view

In the Details View config for a "Form" component, use the "configurable-enum-select" input type
and additionally define the "enumId" of the enum config it refers to:
```
"component": "Form",
"config": {
  "cols": [
    [
      {
        "id": "status",
        "input": "configurable-enum-select",
        "enumId": "project-status",
        "placeholder": "Status"
      },
```


#### Defining Note interaction types
There are a few specially built-in types of enums.
The interaction types available for Notes are configured as the `enum:interaction-type`.

In addition to `id` and `label` for the interaction types you can optionally also configure `"color"`and `"isMeeting"`.
`"color"`can contain a background color for the entry in the form of the hexadecimal code, e.g. #E1F5FE.
`"isMeeting"` is of the type boolean and tells whether the interaction type refers to a meeting or not.

Example:
```
"enum:interaction-type": [
    {
        "id": "",
        "label": ""
    },
    {
        "id": "HOME_VISIT",
        "label": "Home Visit"
    },
    {
        "id": "ANNUAL_SURVEY",
        "label": "Annual Survey",
        "color": "#FFFDE7"
    },
    {
        "id": "RATION_DISTRIBUTION",
        "label": "Ration Distribution",
        "color": "#E1F5FE",
        "isMeeting": true
    }
}
```

#### Defining attendance status types
Another specially built-in type of enums is the attendance status options that can be tracked.
These are configured as the `enum:attendance-type`.

Apart from to `id` and `label` attendance status types have to also define a few additional properties:
- `shortName`: a one letter representation to display to the user
- `label`: a longer, human-readable name of the status
- `style`: string defining a css class to style this attendance status (especially the background-color) 
- `countAs`: the logical type of this status for analysis, there are three categories for this: "PRESENT", "ABSENT" and "IGNORE" 

Example:
```
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
```


-----
## Example

An example of a full config file:

```
{
    "navigationMenu": {
        "items": [
            {"name": "Dashboard", "icon": "home", "link": "/dashboard"},
            {"name": "Children", "icon": "child", "link": "/child"},
            {"name": "Schools", "icon": "university", "link": "/school"},
            {"name": "Notes", "icon": "file-text", "link": "/note"},
            {"name": "Attendance Register", "icon": "table", "link": "/attendance"},
            {"name": "Admin", "icon": "wrench", "link": "/admin"},
            {"name": "Users", "icon": "user", "link": "/users"},
            {"name": "Database Conflicts", "icon": "wrench", "link": "/admin/conflicts"},
            {"name": "Help", "icon": "question-circle", "link": "/help"}
        ]
    },
    "notes": {
        "InteractionTypes": {
            "NONE": {"name": ""},
            "HOME_VISIT": {"name": "Home Visit"},
            "GUARDIAN_TALK": {"name": "Talk with Guardians"},
            "CHILD_TALK": {"name": "Talk with Child"},
            "INCIDENT": {"name": "Incident"},
            "DISCUSSION": {"name": "Discussion/Decision", "color": "#E1BEE7"},
            "VISIT": {"name": "School/Hostel Visit"},
            "PHONE_CALL": {"name": "Phone Call"},
            "COACHING_TALK": {"name": "Talk with Coaching Teacher"},
            "PEER_TALK": {"name": "Talk with Peer"},
            "NEIGHBOUR_TALK": {"name": "Talk with Neighbours"},
            "GUARDIAN_MEETING": {"name": "Guardians' Meeting", "color": "#E1F5FE", "isMeeting": true},
            "CHILDREN_MEETING": {"name": "Children's Meeting", "color": "#E1F5FE", "isMeeting": true},
            "DAILY_ROUTINE": {"name": "Daily Routine", "color": "#F1F8E9"},
            "ANNUAL_SURVEY": {"name": "Annual Survey", "color": "#FFFDE7"},
            "EXCURSION": {"name": "Excursion/Trip", "color": "#E1F5FE", "isMeeting": true},
            "PARTNER_CONTACT": {"name": "Contact with other partners (club/NGO/...)"},
            "RATION_DISTRIBUTION": {"name": "Ration Distribution", "color": "#E1F5FE", "isMeeting": true}
        }
    },
    "view:": {
        "component": "Dashboard",
        "config": {
            "widgets": [
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
                },
                {
                    "component": "AttendanceAverageDashboard"
                },
                {
                    "component": "AttendanceWarningsDashboard"
                }
            ]
        }
    },
    "view:user": {"component": "UserAccount"},
    "view:note": {"component": "NotesManager", "config": { "title": "Notes & Reports"}},
    "view:admin": {"component": "Admin", "requiresAdmin": true},
    "view:users": {"component": "UserList", "requiresAdmin": true},
    "view:help": {"component": "Help"},
    "view:attendance": {"component": "AttendanceManager"},
    "view:attendance/analysis": {"component": "AttendanceAnalysis"},
    "view:attendance/add/month": {"component": "AddMonthAttendance"},
    "view:attendance/add/day": {"component": "AddDayAttendance"},

    "view:school": {"component": "SchoolsList", "config": { "title": "Schools List"} },
    "view:school/:id": {
        "component": "SchoolDetails",
        "config": {
            "submenu": [
                {
                    "name": "Education",
                    "components": ["previousSchools", "aserResults"]
                }
            ],
            "icon": "university"
        }
    },
    "view:child": {"component": "ChildrenList", "config": { "title": "Children List"} },
    "view:child/:id": {
        "component": "ChildDetails",
        "config": {
            "submenu": [
                {
                    "name": "Education",
                    "components": ["previousSchools", "aserResults"]
                }
            ],
            "icon": "child"
        }
    }
}

```
