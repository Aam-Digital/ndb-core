import { Ordering } from "../../../../core/basic-datatypes/configurable-enum/configurable-enum-ordering";

export const ratingAnswers = Ordering.imposeTotalOrdering([
  {
    id: "notTrueAtAll",
    label: $localize`:Rating answer:not at all`,
    color: "rgba(253, 114, 114, 0.5)",
  },
  {
    id: "rarelyTrue",
    label: $localize`:Rating answer:rarely`,
    color: "rgba(255, 165, 0, 0.5)",
  },
  {
    id: "usuallyTrue",
    label: $localize`:Rating answer:usually`,
    color: "rgba(255, 242, 0, 0.5)",
  },
  {
    id: "absolutelyTrue",
    label: $localize`:Rating answer:absolutely`,
    color: "rgba(144, 238, 144, 0.5)",
  },
  {
    id: "noAnswerPossible",
    label: $localize`:Rating answer:N/A`,
    color: "#b0b0b0",
  },
]);
