import { ComponentTuple } from "#src/app/dynamic-components";

/**
 * The components of the hierarchy feature that its data source names in row decorations and toolbar controls,
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
    "HierarchySelect",
    () =>
      import("./hierarchy-select/hierarchy-select.component").then(
        (c) => c.HierarchySelectComponent,
      ),
  ],
  [
    "HierarchyExpandAll",
    () =>
      import("./hierarchy-expand-all/hierarchy-expand-all.component").then(
        (c) => c.HierarchyExpandAllComponent,
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
