import { InteractionType } from "../../../child-dev-project/notes/model/interaction-type.interface";

export const defaultInteractionTypes: InteractionType[] = [
  {
    id: "",
    label: "",
  },
  {
    id: "HOME_VISIT",
    label: $localize`:Interaction type/Category of a Note:Home Visit`,
  },
  {
    id: "GUARDIAN_TALK",
    label: $localize`:Interaction type/Category of a Note:Talk with Guardians`,
  },
  {
    id: "CHILD_TALK",
    label: $localize`:Interaction type/Category of a Note:Talk with Child`,
  },
  {
    id: "INCIDENT",
    label: $localize`:Interaction type/Category of a Note:Incident`,
  },
  {
    id: "DISCUSSION",
    label: $localize`:Interaction type/Category of a Note:Discussion/Decision`,
    color: "#E1BEE7",
  },
  {
    id: "VISIT",
    label: $localize`:Interaction type/Category of a Note:School/Hostel Visit`,
  },
  {
    id: "PHONE_CALL",
    label: $localize`:Interaction type/Category of a Note:Phone Call`,
  },
  {
    id: "COACHING_TALK",
    label: $localize`:Interaction type/Category of a Note:Talk with Coaching Teacher`,
  },
  {
    id: "PEER_TALK",
    label: $localize`:Interaction type/Category of a Note:Talk with Peer`,
  },
  {
    id: "NEIGHBOUR_TALK",
    label: $localize`:Interaction type/Category of a Note:Talk with Neighbours`,
  },
  {
    id: "GUARDIAN_MEETING",
    label: $localize`:Interaction type/Category of a Note:Guardians' Meeting`,
    color: "#E1F5FE",
    isMeeting: true,
  },
  {
    id: "CHILDREN_MEETING",
    label: $localize`:Interaction type/Category of a Note:Children's Meeting`,
    color: "#E1F5FE",
    isMeeting: true,
  },
  {
    id: "DAILY_ROUTINE",
    label: $localize`:Interaction type/Category of a Note:Daily Routine`,
    color: "#F1F8E9",
  },
  {
    id: "ANNUAL_SURVEY",
    label: $localize`:Interaction type/Category of a Note:Annual Survey`,
    color: "#FFFDE7",
  },
  {
    id: "EXCURSION",
    label: $localize`:Interaction type/Category of a Note:Excursion/Trip`,
    color: "#E1F5FE",
    isMeeting: true,
  },
  {
    id: "PARTNER_CONTACT",
    label: $localize`:Interaction type/Category of a Note:Contact with other partners (club/NGO/...)`,
  },
  {
    id: "RATION_DISTRIBUTION",
    label: $localize`:Interaction type/Category of a Note:Ration Distribution`,
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
  {
    id: "LIFE_SKILLS",
    label: $localize`:Interaction type/Category of a Note:Life Skills Workshop`,
    color: "#E1F5FE",
    isMeeting: true,
  },
];
