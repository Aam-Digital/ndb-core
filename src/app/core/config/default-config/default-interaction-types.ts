import { InteractionType } from "../../../child-dev-project/notes/model/interaction-type.interface";

export const defaultInteractionTypes: InteractionType[] = [
  {
    id: "VISIT",
    label: $localize`:Interaction type/Category of a Note:Home Visit`,
  },
  {
    id: "GUARDIAN_TALK",
    label: $localize`:Interaction type/Category of a Note:Talk with Guardians`,
  },
  {
    id: "INCIDENT",
    label: $localize`:Interaction type/Category of a Note:Incident`,
  },
  {
    id: "NOTE",
    label: $localize`:Interaction type/Category of a Note:General Note`,
  },
  {
    id: "GUARDIAN_MEETING",
    label: $localize`:Interaction type/Category of a Note:Guardians' Meeting`,
    color: "#E1F5FE",
    isMeeting: true,
  },
  {
    id: "COACHING_CLASS",
    label: $localize`:Interaction type/Category of a Note:Coaching Class`,
    color: "#EEEEEE",
    isMeeting: true,
  },
  {
    id: "SCHOOL_CLASS",
    label: $localize`:Interaction type/Category of a Note:School Class`,
    color: "#EEEEEE",
    isMeeting: true,
  },
];
