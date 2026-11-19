import { ComponentTuple } from "#src/app/dynamic-components";

/**
 * The components of the hierarchy feature that its data source names in row options and toolbar controls,
 * and its admin setting of list views.
 */
export const hierarchyComponents: ComponentTuple[] = [
  [
    "HierarchyTreeCell",
    () =>
      import("./hierarchy-tree-cell/hierarchy-tree-cell.component").then(
        (c) => c.HierarchyTreeCellComponent,
      ),
  ],
  [
    "HierarchyChildCount",
    () =>
      import("./hierarchy-child-count/hierarchy-child-count.component").then(
        (c) => c.HierarchyChildCountComponent,
      ),
  ],
  [
    "HierarchyToolbar",
    () =>
      import("./hierarchy-toolbar/hierarchy-toolbar.component").then(
        (c) => c.HierarchyToolbarComponent,
      ),
  ],
  [
    "AdminHierarchyFields",
    () =>
      import("./admin-hierarchy-fields/admin-hierarchy-fields.component").then(
        (c) => c.AdminHierarchyFieldsComponent,
      ),
  ],
];
