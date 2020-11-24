# ConfigService and the config-fix.json file
> THIS DOCUMENT IS STILL WORK IN PROGRESS AND WILL BE CONTINUOUSLY UPDATED AS THE DESIGN OF THE SYSTEM EVOLVES

The config file is a json object containing information about how several components are supposed to be displayed. It is loaded by the `ConfigService` and then distributed to the relevant modules. This document aims to explain how the `ConfigService` interacts with the rest of the application and all options that can be set within the `config-fix.json`(TODO: change name of config file?) file.
-----
<!-- TOC -->

- [Config Service](#config-service)
- [Config File](#config-file)
    - [Notes](#notes)
- [Example](#example)

<!-- /TOC -->
-----
## Config Service

![](../../images/config_service.png)

> TODO: Explainatory text

-----
## Config File

The config file is a json object containing information about how several components are supposed to be displayed.

### Notes

Here we can configure which note types should exist, what background color they have and whether or not they are a meeting.
This is done by providing and Object under the `"notes"` key with the `"InteractionTypes"` name as follows:
```
{
   ...
    "notes": {
        "InteractionTypes": {
            ...
        }
    },
    ...
}
```
Now let's add a new note type. To do this we ammend a new name/value pair to the `"InteractionTypes"` value:
```
{
   ...
    "notes": {
        "InteractionTypes": {
            "DATABASE_STRING": {"name": "Our new note type"},
        }
    },
    ...
}
```
The key of the new entry, here `"DATABASE_STRING"` is what gets saved to the database, whereas the value `{"name": "Our new note type"}` gets used throughout the application when transforming back from the database (using this config file). If you edit the value (e.g. `{"name": "Our new note type"}` to `{"name": "edited note type"}`) this change will effect all saved notes, since the database only retains `"DATABASE_STRING"` for all corresponding notes.

Now we want to highlight this note type in the note list by adding a background color. This can be done by simply adding the optional `"color"` property.
```
{
   ...
    "notes": {
        "InteractionTypes": {
            "DATABASE_STRING": {"name": "Our new note type", "color": "#00D8F8"},
        }
    },
    ...
}
```

Say we want to add new note type that refers to a group meeting, so we can trach absence/attendance on the note using the optional `"isMeeting"` property.
```
{
   ...
    "notes": {
        "InteractionTypes": {
            "DATABASE_STRING": {"name": "Our new note type", "color": "#00D8F8"},
            "GROUP_MEETING": {"name": "Group meeting", "isMeeting": true},
        }
    },
    ...
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
