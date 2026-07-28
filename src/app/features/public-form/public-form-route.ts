/**
 * Top-level route segment under which public (anonymous) forms are served.
 *
 * Kept in a module without imports of its own, because the app bootstrap needs this value
 * (see bootstrap-environment.ts) and must not load the public form components and their
 * dependencies while doing so.
 */
export const PUBLIC_FORM_ROUTE = "public-form";
