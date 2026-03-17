# Feature Module: Attendance

This module provides

- an `attendance` datatype to maintain a participant list including a status like "present"/"absent"
- UI components to create an "event" entity from a "recurring activity" entity and guide the user through a roll call to document the status of each participant for that event one by one
- UI components to analyze summarized statistics of "events" recorded for the same "recurring activity", showing attendance percentages, calendar views, etc.

All functionality is configurable.
Any entity type can be set up to serve as a "recurring activity" (i.e. a kind of course or event template) or "event" (i.e. a record of one specific session, with concrete attendance status for participants).

## Event records & Attendance data

An "Event" entity represents one specific session at a concrete point in time.
This is the smallest unit and for each "Event" participants have a specific attendance status.

### Attendance Status

The attendance status options are a configurable enum.
You can add or change the status that can be selected (or allow users in the app to change the configuration).

Each option is assigned to an abstract status type to define how it is used in analysis
(see `AttendanceLogicalStatus`):

- "PRESENT"
- "ABSENT",
- "IGNORE"

## Recurring Activities

A "Recurring Activity" entity represents a longer-term course or program.
Users create multiple "Event" records for such an activity over time.

The Recurring Activity serves as a template to quickly create a new Event for a given date.
It prefills the participants and optionally also some other details like the title or a category,
copying such data from the Recurring Activity into each Event that is created from it.

The Recurring Activity also serves as a container, grouping all its Events
and showing a UI with summarized statistics and analysis to the user.

## Feature Configuration

see [AttendanceFeatureConfig](./model/attendance-feature-config.ts)

The feature can be configured through the central config doc in the database.
This especially includes the definition which entity types and fields are used for the "recurring activity" and "event" records.

The relevant fields (e.g. which field includes the "attendance"-type data) can be auto-detected from the schema
and do not necessarily have to be configured manually.

---

## Considerations for Development

Use the `AttendanceService` as a central access point to data.
It handles resolution of the relevant fields and mappings, based on the feature configuration.
To work with records in the code the `EventWithAttendance` class provides a wrapper that resolves logical fields, no matter what the exact entity type and schema are.
