import { ComponentTuple } from "../../dynamic-components";

export const whiteboardComponents: ComponentTuple[] = [
  [
    "Whiteboard",
    () =>
      import("./whiteboard/whiteboard.component").then(
        (c) => c.WhiteboardComponent,
      ),
  ],
];
