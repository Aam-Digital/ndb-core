import { Center } from "../../model/child";

export const centersUnique: Center[] = [
  { id: "alipore", label: $localize`:center:Alipore` },
  { id: "tollygunge", label: $localize`:center:Tollygunge` },
  { id: "barabazar", label: $localize`:center:Barabazar` },
];

// multiple entries for the same value increase its probability
export const centersWithProbability = [0, 0, 1, 2].map((i) => centersUnique[i]);
