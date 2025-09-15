- closes #GITHUB_ISSUE_NUMBER
- closes #ANOTHER_GITHUB_ISSUE_NUMBER (_delete if not applicable_)

### PR Checklist
_Before you request a manual PR review from someone, please go through all of this list, check the point and mark them checked here.
This helps us reduce the number of review cycles and use the time of our core reviewers more effectively._

- [ ] all automatic CI checks pass (🟢)
  - i.e. code formating (`ng lint`) passes
  - i.e. unit tests (`ng test`) passes
  - in some cases unit test coverage can be difficult to achieve. If that or any other CI check fails, you can also leave short a comment here why this should be accepted anyway.
- [ ] manually tested (all) required functionality described in the issue  manually yourself on the final version of the code (developer)
- [ ] reviewed the "Files changed" section of the PR briefly yourself to check for any unwanted changes
   - e.g. clean up debugging console.log statements, disabled tests, ...
   - please also avoid changes that are not directly related to the issue of the PR, even small code reformatings make the review process much more complex
- [ ] 🚦 PR status is changed to "Ready for Review"
  - while you are still working on initial implementation, keep the PR in "Draft" status
  - once you are done with your initial work, change to "Ready for Review". This will trigger some additional automated checks and reviews.
  - (PR = "Ready for Review" does not immediately request a manual review yet, first complete the further checks below)
- [ ] marked each code review comment as resolved OR commented on it with a question, if unsure
  - both implementing suggestions of automatic code review or discarding them as not applicable is okay
- [ ] all checkboxes in this checklist are checked (to show the reviewer this really is ready)
- [ ] 🚦 moved the issue related to this PR to Status "Functional Review" to request a personal review

⏪ if issues are commented from testing or code review, make changes. Please then re-check every item of the checklist here again.

-----
### Remaining TODOs:
- [ ] unit tests
