# See "Attendance" sheet
#
# Missing rows by description
# - "Attendance overview for each child/beneficiary"
# - "Dashboard view"
# - "Attendance Overview"
Feature: Attendance

  # Covers "Attendance Percentage"
  Scenario: View detailed attendance summary
    The School Info table shows the average attendance for every child.

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
    And I select the tab "School Info"
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
