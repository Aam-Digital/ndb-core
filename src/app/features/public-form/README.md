# Public Forms

Public forms let people without a user account record data into the system, through a link that
can be shared or embedded in a website. A typical use is letting participants self-register for a
programme or answer a survey, so that staff only review the records afterwards.

Each form is one `PublicFormConfig:*` entity, configured under _Admin > Public Forms_. The admin
screen itself is a `ViewConfig` defined in [`public-form.module.ts`](public-form.module.ts),
not in the database config, and several of its fields use custom edit components registered in
that same file.

## How a submission works

`PublicFormComponent` builds one entity form per configured record type, applies the pre-filled
values and any ids taken from a "magic link", and on submit saves each entity in turn.

Every record a public form creates is marked with the form that created it:

```ts
entry.entity.created = new UpdateMetadata(`PublicForm:${this.formConfig().getId(true)}`);
```

so the stored document carries `created.by = "PublicForm:<form-id>"`. That marker is what tells
a record submitted through a form apart from one a logged-in user created, and the backend uses
it to scope notification rules to a single form.

The marker only survives for anonymous submissions: `EntityMapperService.setEntityMetadata`
prefers the current user's id whenever someone is logged in. An admin who opens the form's link
in the browser they are logged in to therefore creates a record stamped with their own user id,
which no form-scoped rule matches - so no confirmation email is sent, and nothing says why. Test
public forms in a private window.

Entries that were already saved are skipped on a retry, because the `public` role only has
`create` permission and re-saving would be an update.

## Permissions

External users act as the `public` role, which needs `create` permission for the record type the
form writes. The admin screen warns when that permission is missing
(`PublicFormPermissionWarningComponent`) and offers to add it.

## Submission confirmation emails

A form can confirm a submission by email to the person who filled it in. Two settings on
`PublicFormConfig` control this:

- `sendConfirmationEmail` — whether a confirmation is sent at all
- `confirmationEmailField` — the id of the field holding the recipient's address

The field is chosen with `EditPublicFormEmailFieldComponent`, which offers only fields of the
`email` datatype on the record type the form creates. The record type has to be saved before any
fields can be offered, because the component reads it from the stored entity rather than from the
form being edited (the same is true of `EditPublicFormColumnsComponent`).

Sending the email is **not** done by this module. The settings are only stored here; the
[aam-services backend](https://github.com/Aam-Digital/aam-services) reads the `PublicFormConfig`
document, derives a notification rule scoped by `created.by`, and takes the recipient's address
from the submitted record. Without that backend the settings have no effect.

## Multi-form configs

`PublicFormConfig.forms` holds several record types for one form, and supersedes the single
`entity` / `columns` / `prefilled` / `linkedEntities` fields, which are deprecated. Note that the
admin screen still edits the deprecated fields, so configs created through the UI use the
single-entity format.
