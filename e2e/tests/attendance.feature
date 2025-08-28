Feature: Attendance
  Users can track daily attendance of participants in recurring activities and analyze attendance rates.
  see Support Center: https://chatwoot.help/hc/aam-digital/articles/1730371580-managing-recording-attendance-of-event-participants

  Scenario: Create a Recurring Activity
    Define a new record representing a regular activity for which day-wise attendance can be recorded
    and add participants to it.

    When I create a new Recurring Activity record from the Recurring Activities list
    Then the new activity is listed in the List View of Recurring activities
    And  the new activity is listed on the "Record Attendance" screen
    When I click on the activity in the "Record Attendance" screen
    Then all the participants added when creating the Activity are shown for marking their attendance

  Scenario: Edit participants of a Recurring Activity
    Add and remove a participant in an existing Recurring Activity

  Scenario: Archive a Recurring Activity
    Archiving an activity should hide it from screens and not list it in the "Record Attendance" screeen anymore.
  
  Scenario: See only Recurring Activities assign to own user for recording attendance
    Users should see only those Recurring Activities on the "Record Attendance" screen which are assigned to her/him.
    Activities not assigned to the own account can be shown when clicking "Show more".

  Scenario: Track attendance for groups
    Current (active) group members are automatically shown as participants when recording attendance.
    (TODO: also "excluded participants")

  # Implemented as "Record attendance for one activity"
  Scenario: Record attendance for one activity
    Select an existing Recurring Activity from the "Record Attendance" screen
    and mark attendance for a given day.

  # Implemented as "Attendance Percentage"
  Scenario: View detailed attendance summary for one participant
    The "Attendance" tab shows the average attendance for each child.

    Given an activity "A" of type "School Class"
    And a list of children participating in activity "A" with the following names
      | Name |
      | X    |
      | Y    |
    And the following attendance record for activity "A" this month
      | Day of month | X       | Y               |
      | 1            | Present | Present         |
      | 2            | Present | Absent <remark> |
      | 3            | Present | Late            |
      | 4            | Present | Excused         |
    When I navigate to "Children"
    And I select the tab "Attendance"
    Then I see a table containing the following rows
      | Name | Attendance (School) | Attendance (Coaching) |
      | X    | 100%                |                       |
      | Y    | 100%                |                       |
    When I hover over the "Attendance (School)" cell in the row with Name "X"
    Then I see a popup containing "A"
    Then I see a popup containing "attended 4 / 4 events"
    And I see a calendar showing the current month
    And I see the days that child "X" attended an event highlighted in the calendar
    When I hover over the "Attendance (School)" cell in the row with Name "Y"
    Then I see a popup containing "A"
    Then I see a popup containing "attended 1 / 4 events"
    Then I see a popup containing "excluding 1 events excused or unknown"
    When I click on day "2" of the month
    Then the listbox "Status" has the selected option "Absent"
    And the input "Remark" has the value "<remark>"

  Scenario: View detailed attendance summary for one activity
    The Recurring Activity details show day-wise attendance
    and statistics summarized for the group of participants.

  Scenario: View recorded events in the Notes list
    The overall Notes list also include an entry for the recorded attendance
    when toggling the "include events" in its context menu.

  Scenario: Check absent students on the dashboard
    Those students who have been absent in more than two events are listed on the dashboard.