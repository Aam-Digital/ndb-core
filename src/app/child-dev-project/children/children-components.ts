import { ComponentTuple } from "../../dynamic-components";

export const childrenComponents: ComponentTuple[] = [
  [
    "ChildrenList",
    () =>
      import("./children-list/children-list.component").then(
        (c) => c.ChildrenListComponent,
      ),
  ],

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
        "./children-list/recent-attendance-blocks/recent-attendance-blocks.component"
      ).then((c) => c.RecentAttendanceBlocksComponent),
  ],
  [
    "Aser",
    () =>
      import("./aser/aser-component/aser.component").then(
        (c) => c.AserComponent,
      ),
  ],
  [
    "ChildBlock",
    () =>
      import("./child-block/child-block.component").then(
        (c) => c.ChildBlockComponent,
      ),
  ],
  [
    "ChildrenBmiDashboard",
    () =>
      import(
        "./health-checkup/children-bmi-dashboard/children-bmi-dashboard.component"
      ).then((c) => c.ChildrenBmiDashboardComponent),
  ],
  [
    "EducationalMaterial",
    () =>
      import(
        "./educational-material/educational-material-component/educational-material.component"
      ).then((c) => c.EducationalMaterialComponent),
  ],
  [
    "BmiBlock",
    () =>
      import("./health-checkup/bmi-block/bmi-block.component").then(
        (c) => c.BmiBlockComponent,
      ),
  ],
  [
    "HealthCheckup",
    () =>
      import(
        "./health-checkup/health-checkup-component/health-checkup.component"
      ).then((c) => c.HealthCheckupComponent),
  ],
];
