import { ComponentTuple } from "../../dynamic-components";

export const schoolsComponents: ComponentTuple[] = [
  [
    "PreviousSchools",
    () =>
      import("./child-school-overview/child-school-overview.component").then(
        (c) => c.ChildSchoolOverviewComponent,
      ),
  ],
  [
    "ChildrenOverview",
    () =>
      import("./child-school-overview/child-school-overview.component").then(
        (c) => c.ChildSchoolOverviewComponent,
      ),
  ],
  [
    "ChildSchoolOverview",
    () =>
      import("./child-school-overview/child-school-overview.component").then(
        (c) => c.ChildSchoolOverviewComponent,
      ),
  ],
  [
    "DisplayParticipantsCount",
    () =>
      import(
        "./display-participants-count/display-participants-count.component"
      ).then((c) => c.DisplayParticipantsCountComponent),
  ],
];
