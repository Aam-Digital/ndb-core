# See "Create entity" sheet
#
# Missing rows by description:
# - Marking an education record as inactive
# - Mismatch between start and end date under education tab.
# - Attendance
# - Capturing the health details of a child
# - Capturing the health details of a child- blood group
# - Capturing the health details of a child- blood group
# - Capturing the health details of a child- Health&Weight Tracking
# - Create a new note from the child menu
# - Notes&Tasks
# - Capturing the details of Education& material distributed to a child
#
Feature: Entity creation

  # Covers "Add a child/beneficiary from menu bar"
  Scenario: Add a child
    When I navigate to "Children"
    And I click the button "Add new"
    Then the heading "Adding new Child" is visible
    When I fill the input "Name" with "<name>"
    And I click the button "Save"
    Then the heading "<name>" is visible
    When I click the button "Edit"
    And I fill the input "Name" with "<name2>"
    And I click the button "Save"
    Then I see the heading "<name2>"
    When I navigate to "Children"
    And I fill the input "Filter" with "<name2>"
    Then I the table has the rows
      | Name    |
      | <name2> |

  # Covers:
  # - "Capturing the education history of the child"
  # - "Editing the education history of a child"
  Scenario: Edit education history
    Given a child "<name>"
    And a school "<school>"
    When I navigate to "Children"
    And I click on the link "<name>"
    And I select the tab "Education"
    Then the table "School History" is empty
    When I click the button "Create a new School Enrollment record"
    Then the input "Start date" has the value "<today>"
    And the text "Currently: active" is visible
    When I select the value "<school>" for the field "School"
    And I fill the input "Class" with "<class>"
    And I fill the input "Result" with "50"
    And I click the button "Save"
    Then the table "School history" has the rows
      | Start date | End date | School   | Class   | Result |
      | <today>    |          | <school> | <class> | 50     |
    When I click the button "edit" in the row with "School" being "<school>"
    Then the input "Result" has the value "50"
    When I fill the input "Result" with "80"
    And I click the button "Save"
    Then the table "School history" has the rows
      | Start date | End date | School   | Class   | Result |
      | <today>    |          | <school> | <class> | 50     |
