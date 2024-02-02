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
    "ChildBlock",
    () =>
      import("./child-block/child-block.component").then(
        (c) => c.ChildBlockComponent,
      ),
  ],
];
