# How to review a pull request

Every regular team member is encouraged to review other pull requests (PRs).
You don't have to be a senior programmer or an expert in that particular part of the code
to help by reviewing PRs (and possibly learn something along the way).

To establish best practices for our project and make reviews easier for you
we are documenting guidelines for reviews here.

## Goals: Why do we have reviews?

Why do we bother to spend time on code reviews / PR reviews?
The main goals are:

1. Prevent bugs from getting into the master branch - and thereby onto users' devices.
2. Improve code quality - especially ensuring that the code is easy to understand.

Everybody has blind spots
and sometimes we are also tempted to take short cuts (and forget to clean them up later).
So it's essential to have a second set of eyes looking at code
regardless of whether it was written by a long contributing, experienced developer
or someone submitting their first PR.

Reviews are not about criticizing someone.
They are about jointly discussing how things can be improved
or even just what parts have room for improvement.

## Definition of Done: When to accept a PR?

As far as possible we try to automate the must-have criteria to accept and merge a PR
with the help of GitHub and Travis CI tools.
But one of these required steps is also that the PR must have an "approving" review of another developer.

The following aspects are required for a PR to be merged.
These are our expectations of quality that we have set ourselves:

The PR's changes must be:

1. **working for the user as expected**
2. **tested by automated unit tests**
3. **easy to understand in code**

The following sections specify more details of these high-level aspects
and give you concrete steps for how you can review them.

### (1.) Is the app working?

The most essential thing about any change: It should work for users running the app.

As a reviewer that means for you:

1. Check out the branch of the PR on your machine.
2. Run `npm install` to make sure you have all the right dependencies installed.
3. Run the app locally.
   Put yourself in the shoes of a user and click around, testing the app: 1. Does the new feature / bugfix function as discussed and expected? 2. How are edge cases and errors handled?
   _ *This depends on the kind of change. If you can't think of any, just go on.* 3. Does the user get feedback about what is going on in a way that is understandable for people with no technical knowledge?
   (That is in case of success as well as failure.) 4. Do related features that might have been affected by the changes of this PR still work?
   _ _Again, this depends on the kind of PR. If you don't see anything else to test, that's absolutely okay._ 5. If the change affects UI elements: How do they look in a smaller browser window?
4. Write a comment in the PR on GitHub about what any problems or ideas you encountered.

### (2.) Is the code tested with unit tests?

The unit testing is checked automatically and concerns two aspects:

- Are all tests passing?
  - _That is new tests for this PR as well as all other tests to ensure no previously working function was broken._
- Are the changes of this PR covered by unit tests?
  - _We aim for a "test coverage" of at least 80% and PRs should contain new unit tests for the changes they are making._

The CI system reports the status of these conditions automatically and displays them in the GitHub PR.

You don't have to do any specific reviewing regarding this.
If some tests fail, you may want to wait with your review until the author has fixed them so that you can review a final, working state of the code.
Also, if you notice some important edge cases that are not tested by unit tests yet, do suggest these to be added.

### (3.) Is the code understandable and well structured?

Reviewing a PR means reviewing code.
If you spot a logical error or have a suggestion how to rewrite some code to improve performance that's awesome.
But even more important is asking the right questions and pointing out all the parts that are hard (or impossible) to understand.

Rather sooner than later even the author of the code will have forgotten the hidden logic of that super complex function.
And she/he will thank your for requesting a simpler code structure or a better documentation during your review.

You can review the PR's code changes easily on GitHub:

1. In the GitHub PR switch to the "Files changed" tab.
2. Go through the code changes and comment on specific lines:
   1. If you don't understand what a block of code does.
      It should be possible to understand everything.
      Be ruthless and ask about everything that's unclear -
      code structure and/or documentation should be improved for everybody in this case.
   2. If you have a suggestion to improve the code.
      Whether you have an idea to structure things in a clearer way
      or to solve it differently - share your suggestions.
   3. You can also suggest code changes from within the GitHub UI that can be merged - without having the checkout and commit to the branch on you local machine. See [Suggesting Changes on GitHub](https://haacked.com/archive/2019/06/03/suggested-changes/)
3. "Finish your review" in GitHub.
   If there are issues or questions remaining, set the review status "Comment" or "Request Changes" instead of "Approve".

## Finish up

**_That's it - thank you for improving the project with your feedback through your PR review!_**

If you commented with questions or suggestions, please try to follow up quickly when you receive replies.
Otherwise, finishing and merging the PR gets delayed.
