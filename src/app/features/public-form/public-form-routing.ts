import { Routes } from "@angular/router";
import { SubmissionSuccessComponent } from "./submission-success/submission-success.component";
import { PublicFormComponent } from "./public-form.component";

export const publicFormRoutes: Routes = [
  {
    path: "public-form/:id",
    component: PublicFormComponent,
  },
  { path: "submission-success", component: SubmissionSuccessComponent },
];
