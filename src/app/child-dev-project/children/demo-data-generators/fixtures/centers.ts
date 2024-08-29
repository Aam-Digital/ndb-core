import { ConfigurableEnumValue } from "../../../../core/basic-datatypes/configurable-enum/configurable-enum.interface";

export const centersUnique: ConfigurableEnumValue[] = [
  { id: "alipore", label: $localize`:center:Alipore` },
  { id: "tollygunge", label: $localize`:center:Tollygunge` },
  { id: "barabazar", label: $localize`:center:Barabazar` },
];

// multiple entries for the same value increase its probability
export const centersWithProbability = [0, 0, 1, 2].map((i) => centersUnique[i]);
