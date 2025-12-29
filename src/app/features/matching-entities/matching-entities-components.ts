import { ComponentTuple } from "../../dynamic-components";

export const matchingEntitiesComponents: ComponentTuple[] = [
  [
    "MatchingEntities",
    () =>
      import("./matching-entities/matching-entities.component").then(
        (c) => c.MatchingEntitiesComponent,
      ),
  ],
  [
    "AdminMatchingEntities",
    () =>
      import("./admin-matching-entities/admin-matching-entities.component").then(
        (c) => c.AdminMatchingEntitiesComponent,
      ),
  ],
];
