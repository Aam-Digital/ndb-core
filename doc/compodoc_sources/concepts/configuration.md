# ConfigService and the config-fix.json file
> THIS DOCUMENT IS STILL WORK IN PROGRESS AND WILL BE CONTINUOUSLY UPDATED AS THE DESIGN OF THE SYSTEM EVOLVES

The config file is a json object containing information about how several components are supposed to be displayed. It is loaded by the `ConfigService` and then distributed to the relevant modules. This document aims to explain how the `ConfigService` interacts with the rest of the application and all options that can be set within the `config-fix.json`, located under /src/app/core/config (TODO: change name of config file?) file.
-----
<!-- TOC -->

- [Config Service](#config-service)
- [Config File](#config-file)
    - [NavigationMenue](#navigationMenu)
    - [enum:interaction-type](#enum:interaction-type)
    - [Views](#views)
    - [Entity](#entity)
- [Example](#example)

<!-- /TOC -->
-----
## Config Service

![](../../images/config_service.png)

> TODO: Explainatory text

-----
## Config File

The config file is a json object containing information about how several components are supposed to be displayed. On the top level of the config file, there are four different kinds of entries:

1. navigationMenu
1. enum:interaction-type
1. views
1. entity


### navigationMenu
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


### enum:interaction-type

Here we can configure different entries for dropdown lists (formerly notes).

The two mandatory fields of each interaction type are `"id"` and `"label"`. `"id"` has the be written in uppercase letters and cannot contain spaces (user underscore _ instead). The `"id"` should always stay the same as it is written to the database. `"label"` holds the human readable text for the dropdown entries and gets used throughout the application when transforming back from the database (using this config file). This text may be changed without any negative effect to data consistency and the change will instantly be visible in all saved entries of this type.

The two optional fields of each interaction type are `"color"`and `"isMeeting"`. `"color"`can contain a background color for the entry in the form of the hexadecimal code, e.g. #E1F5FE. `"isMeeting"` is of the type boolean and tells whether the interactiontype refers to a meeting or not.

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
    ...
    {
        "id": "ANNUAL_SURVEY",
        "label": "Annual Survey",
        "color": "#FFFDE7"
    },
    ...
    {
        "id": "RATION_DISTRIBUTION",
        "label": "Ration Distribution",
        "color": "#E1F5FE",
        "isMeeting": true
    }
}
```
### Views

The largest part of the config file are the views. Each view entry starts with `"view:"`. The part that comes after the colon is what comes after the top level / in the URL of the app. There has to be one view entry with nothing after the colon, thus directing to the root folder of the app. Subfolders are signalized with a "/", e.g. "`view:admin/conflicts:"`. If we append `":id"`, then this is read directly from the app, e.g. `"view:child/:id"`.

The only mandatory field for each view is `"component":` telling the app which component to use for the respective view. The component part has to refer to an existing angular component within the app.

The two optional fields of each view are `"config":` and `"requiresAdmin":`. The latter is a boolean telling the app whether the user has to be logged in as an administrator in order to be able the see the component. 

What comes within the `"config":` object depends on the component being used. The Dashboard-Component for example takes as `"widgets:"` an array of subcomponents, where every entry has to have a `"component:"` and may have an own `"config:"` object.

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
List components showing data in a table (such as ChildrenList oder SchoolsList) usually have the four config objects `"title"`, `"columns"`, `"columngroup"`and `"filters"`.

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

The `"column-group"` object hold the three objects `"default"`, `"mobile"` and `"groups"`. `"default"` and `"mobile"` hold the names of the group of columns being display by default of if on an mobile divice. `"groups"` consists of an array of groups of columns, where every entry has a `"name"` and an array of column names within `"columns"`.

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

The object `"filters"` within the config of a list component is used for filtering the data to be displayed. It holds an array in which every entry has to have an `"id"` and may also have the fields `"type"`, `"default"`, `"true"`, `"false"` and `"all"`.

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
                }
        ]
```


## Entity
The entity object within the config file finally is used to define specifc entity types. The name of the entity types comes after the colon of `"entity:"`, e.g. `"entity:Child"` for an entity type called `Child`. An entity entry has the only field `"attributes:"`, which hols an array of objects of the following type:

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

-----

## Example

An example of a real config file:

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
