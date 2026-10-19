# UX Guidelines

The user should have a consistent experience across all areas of the app
(i.e. whether editing needs to be enabled, how changes can be undone, how and how long notifications are displayed).
More and more these actions will be generalized by components and services that we will use for our implementation of a specific form or page.
Until then, our UX "policy" is loosely documented below:

- Deleting an entity is always possible to undo by a simple SnackBar Action in the related SnackBar notification, shown for 8 seconds.
- Views/Forms are by default not editable and have to be enabled through an "Edit" button.
- Changes in forms are not saved automatically and have to be confirmed through a "Save" button.

## Styling

- Use Angular Material components and follow the Material Design guidelines, for a consistent look.
- Use SCSS. Take colors and sizes from the global variables and mixins in `src/styles/`
  (e.g. `@use "variables/colors";` and `colors.$primary`).
- Use the global style classes in `src/styles/globals/` (e.g. `flex-row`, `margin-regular`) before
  creating new styles.
- If a custom style is needed, create a class with a meaningful name in the component's scss file
  and avoid inline styles.
