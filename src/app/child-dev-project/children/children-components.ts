import { ComponentTuple } from "../../dynamic-components";

export const childrenComponents: ComponentTuple[] = [
  [
    "DisplayParticipantsCount",
    () =>
      import("./display-participants-count/display-participants-count.component").then(
        (c) => c.DisplayParticipantsCountComponent,
      ),
  ],
];
