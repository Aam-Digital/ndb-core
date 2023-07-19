import { ComponentTuple } from "../dynamic-components";

export const conflictResolutionComponents: ComponentTuple[] = [
  [
    "ConflictResolution",
    () =>
      import(
        "./conflict-resolution-list/conflict-resolution-list.component"
      ).then((c) => c.ConflictResolutionListComponent),
  ],
];
