# Welcome!

_Aam Digital_ is open source because we believe in building things together
and letting people benefit from and adapt things rather than everybody reinventing their own wheel.

In order to build great software for small social impact organisations
we welcome anybody willing to contribute.
We are a small core team of full-time developers as well as a few regular volunteer contributors.
So whether you want to extend our code for your own use case or just help out -
we welcome any contributions to make this project better!

---

## Get started

To get started, please have a look at our [Developer Documentation](https://aam-digital.github.io/ndb-core/documentation/additional-documentation/overview.html).

1. See the main [README](./README.md) for instructions to run the app locally.
2. Work through the [Tutorial](https://aam-digital.github.io/ndb-core/documentation/additional-documentation/tutorial.html).
   - This walks you through the setup and basic understanding of the project and also gives an overview of the technologies and frameworks involved.
   - Feel free to skip over steps that seem trivial to you, we tried to make this very beginner friendly.
3. See the workflow described below.
4. Don't hesitate to ask questions!

## Get in touch

Do get in touch with us by commenting on or creating issues here on GitHub.
For more general discussions or questions, use the [Discussions section](https://github.com/orgs/Aam-Digital/discussions).

Our main communication channels in the team are

- **GitHub issues** and **pull requests**.
  Feel free to open one yourself also to ask a question.
- **Slack**. Write us an e-mail to get an invitation to our workspace.

## Where can I help?

Have a look at our issues on GitHub.
Some of them are explicitly label as suitable issues for a new contributor to work on: [Community Help Wanted](https://github.com/orgs/Aam-Digital/projects/2/views/4?filterQuery=label%3A%22Status%3A+Community+Help+Wanted+%28good+first+issue%29%22+).
If you are not sure whether you should work on a certain issue, just post a short comment in the issue to clarify.

Before you start working on an issue, please always comment on it first to help us coordinate.
We will then assign you on the GitHub issue and change the "status" within the project to "In Progress"
(as an outside contributor you may initially not have required permissions on GitHub to assign yourself).

We organize our work using GitHub Projects' kanban boards and issue labels:

- [Project Board](https://github.com/orgs/Aam-Digital/projects/2)
  - Get an overview of all issues (across all repositories) and their status here, we use a kanban-style board where issues are moved through the columns based on their status.
  - The issues in the board are sorted by priority (most important on top).
  - Please do not work on issues in the "Triage / Analysis" status, these topics still required a clearer definition and approval from the core team.
- [Labels](https://github.com/Aam-Digital/ndb-core/labels)
  - Our labels are scoped into a few logical groups (e.g. "Status" or "Type" related labels), do check the descriptions shown beside the label name in the list of GitHub labels.
  - The same labels are maintained across all our repositories.

## Workflow

We are following the "GitHub Flow", using feature branches for development.
Please read through the following short guide before you get started:
[Understanding the GitHub Flow](https://guides.github.com/introduction/flow/).

In summary, this means each feature will be implemented on it's own branch, which will then merged back onto the `master` branch.
If you participate in the development, either by fixing a bug or implementing a new feature, follow these steps:

1. Analyze the bug or feature in a [GitHub issue](https://github.com/Aam-Digital/ndb-core/issues).
   Discuss possible approaches to solve it in the issue.
   Please always comment on an issue before starting work, so that we can coordinate.
2. Create a **new branch** (from the current `master`!) for each issue/feature you are working on. Use a descriptive branch name.
3. Make commits on this branch. Use descriptive commit messages. If things are complex make multiple, logical commits.
   Do _not_ use the same branch for implementing multiple features or bug fixes
   (instead create a separate branch from the `master` branch for each).
4. Run `ng test` to see if all unit tests are passed.
   If possible/necessary add more unit tests related to your new code. All tests must be passed before your contribution can be accepted.
5. Run `ng lint` to see if your code passes our project's code formatting standards.
   All problems must be resolved before your contribution can be accepted.
6. Once you have finished your work or want some feedback/discussion about it, open a new [pull request (PR) on GitHub](https://github.com/Aam-Digital/ndb-core/pulls).
   Any reviews, feedback and discussions about your code will take place in this PR on GitHub. Please follow it and explain or adapt your code if necessary.
7. A **different developer will review** your PR and provide feedback or approve it.
8. PRs have an automatic test system (the CI adds a comment with the link) where others can test the changes.
  - each PR and each commit on `master` branch also are available as a docker image (`pr-<pr_number>`, e.g. pr-101; `<version>-master.<built>`, e.g. 3.52.0-master.1) that can be deployed for testing or as a hotfix, if necessary
9. A core team member will merge the PR onto the `master` branch after review.
10. After merging, the branch is automatically deleted and the corresponding issue(s) are closed.

### Remarks

- Reference an issue on GitHub in your commits or comments by writing the issue number (e.g. `#15` to reference issue #15)
- Use the "Draft" state of GitHub PRs if this is still "work in progress" and should not be reviewed yet.
Also consider adding `[WIP]` to the beginning of the PR title
- If you have a lot of trivial commits in your working feature branch (such as fixed typos, fixed codestyle warnings, ...) you may squash some commits for better readability of the git history.
  This can be done with a git rebase on your feature branch (please **never** rebase the master branch).
  Further information can be found in the [Git Book](https://git-scm.com/book/en/v2/Git-Tools-Rewriting-History).

---

## Copyright
Our project is licensed under GPL 3.0.
Please note that by contributing, you also make your work available to the public for further use under the terms of that license (see [LICENSE.md](./LICENSE.md)).
