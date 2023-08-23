import { ConfigurableEnumValue } from "../../../core/basic-datatypes/configurable-enum/configurable-enum.interface";

export const genders: ConfigurableEnumValue[] = [
  {
    id: "",
    label: "",
  },
  {
    id: "M",
    label: $localize`:Label gender:male`,
  },
  {
    id: "F",
    label: $localize`:Label gender:female`,
  },
  {
    id: "X",
    label: $localize`:Label gender:Non-binary/third gender`,
  },
];
