import { Center } from "../../model/child";

export const centersWithProbability: Array<Center> = [
  // multiple entries for the same value increase its probability
  { id: "alipore", label: "Alipore" },
  { id: "alipore", label: "Alipore" },
  { id: "tollygunge", label: "Tollygunge" },
  { id: "barabazar", label: "Barabazar" },
];

export const centersUnique = centersWithProbability.filter(
  (value, index, self) => self.indexOf(value) === index
);
