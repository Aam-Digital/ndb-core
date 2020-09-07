export const centersWithProbability = [
  // multiple entries for the same value increase its probability
  "Alipore",
  "Alipore",
  "Tollygunge",
  "Barabazar",
  "Howrah",
  "Bally",
  "Santoshpur",
  "Saltlake",
  "Jadavpur",
];

export const centersUnique = centersWithProbability.filter(
  (value, index, self) => self.indexOf(value) === index
);
