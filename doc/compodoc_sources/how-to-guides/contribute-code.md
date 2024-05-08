# How to contribute code to the project

## Workflow

We are following the "GitHub Flow", using feature branches for development.
Please read through the following short guide before you get started:
[Understanding the GitHub Flow](https://guides.github.com/introduction/flow/).

In summary, this means each feature will be implemented on it's own branch, which will then merged back onto the `master` branch. If you participate in the development, either by fixing a bug or implementing a new feature, follow these steps:

1. Analyze the bug or feature in a [GitHub issue](https://github.com/Aam-Digital/ndb-core/issues).
   Discuss possible approaches to solve it in the issue.
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
7. A **different developer will merge** your PR back onto the `master` branch. This makes sure there was a code review and manual testing.
8. After merging, **delete your feature branch** and make sure the corresponding issue(s) and pull request are closed.

### Remarks

- Reference an issue on GitHub in your commits or comments by writing the issue number (e.g. `#15` to reference issue #15)
- Add `[WIP]` to the beginning of the PR title if this is still "work in progress" and should not be merged yet.
- If you have a lot of trivial commits in your working feature branch (such as fixed typos, fixed codestyle warnings, ...) you may squash some commits for better readability of the git history.
  This can be done with a git rebase on your feature branch (please **never** rebase the master branch).
  Further information can be found in the [Git Book](https://git-scm.com/book/en/v2/Git-Tools-Rewriting-History).
- The [Angular Style Guide](https://github.com/johnpapa/angular-styleguide) provides helpful principles for Angular development.
