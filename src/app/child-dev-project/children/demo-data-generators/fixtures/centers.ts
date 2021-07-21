import { Center } from "../../model/child";

export const centersWithProbability: Array<Center> = [
  // multiple entries for the same value increase its probability
  { id: "alipore", label: $localize`:center:Alipore` },
  { id: "alipore", label: $localize`:center:Alipore` },
  { id: "tollygunge", label: $localize`:center:Tollygunge` },
  { id: "barabazar", label: $localize`:center:Barabazar` },
];

export const centersUnique = centersWithProbability.filter(
  (value, index, self) => self.indexOf(value) === index
);
