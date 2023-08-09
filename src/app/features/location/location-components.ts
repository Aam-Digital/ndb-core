import { ComponentTuple } from "../../dynamic-components";

export const locationComponents: ComponentTuple[] = [
  [
    "EditLocation",
    () =>
      import("./edit-location/edit-location.component").then(
        (c) => c.EditLocationComponent,
      ),
  ],
  [
    "ViewLocation",
    () =>
      import("./view-location/view-location.component").then(
        (c) => c.ViewLocationComponent,
      ),
  ],
  [
    "DisplayDistance",
    () =>
      import("./view-distance/view-distance.component").then(
        (c) => c.ViewDistanceComponent,
      ),
  ],
];
