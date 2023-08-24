import { defaultInteractionTypes } from "../../../core/config/default-config/default-interaction-types";
import { warningLevels } from "../../warning-level";

export const noteGroupStories = [
  {
    category: defaultInteractionTypes.find((t) => t.id === "GUARDIAN_MEETING"),
    warningLevel: warningLevels.find((level) => level.id === "OK"),
    subject: $localize`:Note demo subject:Guardians Meeting`,
    text: $localize`:Note demo text:
        Our regular monthly meeting. Find the agenda and minutes in our meeting folder.
      `,
  },
  {
    category: defaultInteractionTypes.find((t) => t.id === "GUARDIAN_MEETING"),
    warningLevel: warningLevels.find((level) => level.id === "OK"),
    subject: $localize`:Note demo subject:Guardians Meeting`,
    text: $localize`:Note demo text:
        Our regular monthly meeting. Find the agenda and minutes in our meeting folder.
      `,
  },

  {
    category: defaultInteractionTypes.find((t) => t.id === "COACHING_CLASS"),
    warningLevel: warningLevels.find((level) => level.id === "OK"),
    subject: $localize`:Note demo subject:Children Meeting`,
    text: $localize`:Note demo text:
        Our regular monthly meeting. Find the agenda and minutes in our meeting folder.
      `,
  },
  {
    category: defaultInteractionTypes.find((t) => t.id === "COACHING_CLASS"),
    warningLevel: warningLevels.find((level) => level.id === "OK"),
    subject: $localize`:Note demo subject:Children Meeting`,
    text: $localize`:Note demo text:
        Our regular monthly meeting. Find the agenda and minutes in our meeting folder.
      `,
  },
  {
    category: defaultInteractionTypes.find((t) => t.id === "COACHING_CLASS"),
    warningLevel: warningLevels.find((level) => level.id === "OK"),
    subject: $localize`:Note demo subject:Drug Prevention Workshop`,
    text: $localize`:Note demo text:
        Expert conducted a two day workshop on drug prevention.
      `,
  },
];
