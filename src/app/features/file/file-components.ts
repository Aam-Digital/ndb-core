import { ComponentTuple } from "../../dynamic-components";

export const fileComponents: ComponentTuple[] = [
  [
    "EditFile",
    () =>
      import("./edit-file/edit-file.component").then(
        (c) => c.EditFileComponent
      ),
  ],
  [
    "ViewFile",
    () =>
      import("./view-file/view-file.component").then(
        (c) => c.ViewFileComponent
      ),
  ],
];
