import { InteractionType } from "../../../child-dev-project/notes/model/interaction-type.interface";

export const defaultInteractionTypes: InteractionType[] = [
  {
    id: "",
    label: "",
  },
  {
    id: "HOME_VISIT",
    label: "Home Visit",
  },
  {
    id: "GUARDIAN_TALK",
    label: "Talk with Guardians",
  },
  {
    id: "CHILD_TALK",
    label: "Talk with Child",
  },
  {
    id: "INCIDENT",
    label: "Incident",
  },
  {
    id: "DISCUSSION",
    label: "Discussion/Decision",
    color: "#E1BEE7",
  },
  {
    id: "VISIT",
    label: "School/Hostel Visit",
  },
  {
    id: "PHONE_CALL",
    label: "Phone Call",
  },
  {
    id: "COACHING_TALK",
    label: "Talk with Coaching Teacher",
  },
  {
    id: "PEER_TALK",
    label: "Talk with Peer",
  },
  {
    id: "NEIGHBOUR_TALK",
    label: "Talk with Neighbours",
  },
  {
    id: "GUARDIAN_MEETING",
    label: "Guardians' Meeting",
    color: "#E1F5FE",
    isMeeting: true,
  },
  {
    id: "CHILDREN_MEETING",
    label: "Children's Meeting",
    color: "#E1F5FE",
    isMeeting: true,
  },
  {
    id: "DAILY_ROUTINE",
    label: "Daily Routine",
    color: "#F1F8E9",
  },
  {
    id: "ANNUAL_SURVEY",
    label: "Annual Survey",
    color: "#FFFDE7",
  },
  {
    id: "EXCURSION",
    label: "Excursion/Trip",
    color: "#E1F5FE",
    isMeeting: true,
  },
  {
    id: "PARTNER_CONTACT",
    label: "Contact with other partners (club/NGO/...)",
  },
  {
    id: "RATION_DISTRIBUTION",
    label: "Ration Distribution",
    color: "#E1F5FE",
    isMeeting: true,
  },
  {
    id: "COACHING_CLASS",
    label: "Coaching Class",
    color: "#EEEEEE",
    isMeeting: true,
  },
  {
    id: "SCHOOL_CLASS",
    label: "School Class",
    color: "#EEEEEE",
    isMeeting: true,
  },
  {
    id: "LIFE_SKILLS",
    label: "Life Skills Workshop",
    color: "#E1F5FE",
    isMeeting: true,
  },
];
