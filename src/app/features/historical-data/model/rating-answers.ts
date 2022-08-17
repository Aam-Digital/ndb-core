import { Ordering } from '../../../core/configurable-enum/configurable-enum-ordering';

export const ratingAnswers = Ordering.imposeTotalOrdering([
  {
    id: "noAnswerPossible",
    label: $localize`:Rating answer:N/A`,
  },
  {
    id: "notTrueAtAll",
    label: $localize`:Rating answer:not at all`,
  },
  {
    id: "rarelyTrue",
    label: $localize`:Rating answer:rarely`,
  },
  {
    id: "usuallyTrue",
    label: $localize`:Rating answer:usually`,
  },
  {
    id: "absolutelyTrue",
    label: $localize`:Rating answer:absolutely`,
  }
]);
