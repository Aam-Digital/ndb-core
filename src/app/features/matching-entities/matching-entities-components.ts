import { ComponentTuple } from "../../dynamic-components";

export const matchingEntitiesComponents: ComponentTuple[] = [
  [
    "MatchingEntities",
    () =>
      import("./matching-entities/matching-entities.component").then(
        (c) => c.MatchingEntitiesComponent
      ),
  ],
];
