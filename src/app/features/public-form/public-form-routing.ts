import { Routes } from "@angular/router";
import { SubmissionSuccessComponent } from "./submission-success/submission-success.component";
import { PublicFormComponent } from "./public-form.component";

/**
 * Top-level route segment under which public (anonymous) forms are served.
 */
export const PUBLIC_FORM_ROUTE = "public-form";

export const publicFormRoutes: Routes = [
  {
    path: "form/:id",
    component: PublicFormComponent,
  },
  { path: "submission-success", component: SubmissionSuccessComponent },
];
