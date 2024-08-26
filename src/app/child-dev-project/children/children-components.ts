import { ComponentTuple } from "../../dynamic-components";

export const childrenComponents: ComponentTuple[] = [
  [
    "GroupedChildAttendance",
    () =>
      import(
        "./child-details/grouped-child-attendance/grouped-child-attendance.component"
      ).then((c) => c.GroupedChildAttendanceComponent),
  ],
  [
    "RecentAttendanceBlocks",
    () =>
      import(
        "../attendance/recent-attendance-blocks/recent-attendance-blocks.component"
      ).then((c) => c.RecentAttendanceBlocksComponent),
  ],
  [
    "ChildBlock",
    () =>
      import("./child-block/child-block.component").then(
        (c) => c.ChildBlockComponent,
      ),
  ],

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
