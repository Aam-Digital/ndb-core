import { WarningLevel } from "../../warning-level";

/**
 * Contains demo group notes. This data is used to create new Note instances with the provided values which then get saved to the MockDB.
 */
export const noteGroupStories = [
  {
    category: { name: "Guardians' Meeting", color: "#E1F5FE", isMeeting: true },
    warningLevel: WarningLevel.OK,
    subject: "Guardians Meeting",
    text:
      "Our regular monthly meeting. Find the agenda and minutes in our meeting folder.",
  },
  {
    category: { name: "Guardians' Meeting", color: "#E1F5FE", isMeeting: true },
    warningLevel: WarningLevel.OK,
    subject: "Guardians Meeting",
    text:
      "Our regular monthly meeting. Find the agenda and minutes in our meeting folder.",
  },

  {
    category: { name: "Children's Meeting", color: "#E1F5FE", isMeeting: true },
    warningLevel: WarningLevel.OK,
    subject: "Children Meeting",
    text:
      "Our regular monthly meeting. Find the agenda and minutes in our meeting folder.",
  },
  {
    category: { name: "Children's Meeting", color: "#E1F5FE", isMeeting: true },
    warningLevel: WarningLevel.OK,
    subject: "Children Meeting",
    text:
      "Our regular monthly meeting. Find the agenda and minutes in our meeting folder.",
  },
  {
    category: { name: "Children's Meeting", color: "#E1F5FE", isMeeting: true },
    warningLevel: WarningLevel.OK,
    subject: "Drug Prevention Workshop",
    text: "Expert conducted a two day workshop on drug prevention.",
  },
];
