import { WarningLevel } from "../../warning-level";

/**
 * Contains demo notes. This data is used to create new Note instances with the provided values which then get saved to the MockDB.
 */
export const noteIndividualStories = [
  {
    category: { name: "Home Visit" },
    warningLevel: WarningLevel.WARNING,
    subject: "Mother sick",
    text:
      "Visited family after we heard that mother is seriously ill. She cannot get up. " +
      "Children are taking care of housework. " +
      "Told her to see doctor. We should follow up next week.",
  },
  {
    category: { name: "Talk with Guardians" },
    warningLevel: WarningLevel.WARNING,
    subject: "Discussed school change",
    text:
      "Discussed future of the child with the parents. They agree that changing school can be a good option. " +
      "Will discuss further together with the child.",
  },

  {
    category: { name: "Phone Call" },
    warningLevel: WarningLevel.OK,
    subject: "Follow up for school absence",
    text:
      "Called to ask for reason about absence. Mother made excuses but promised to send the child tomorrow.",
  },
  {
    category: { name: "Phone Call" },
    warningLevel: WarningLevel.OK,
    subject: "absent because ill",
    text:
      "Mother has called in the morning. Child cannot come to class because of fever.",
  },
  {
    category: { name: "Phone Call" },
    warningLevel: WarningLevel.URGENT,
    subject: "Absence without information",
    text:
      "Child was not in school whole last week again. When calling the mother she didn't know about it. " +
      "Need to follow up urgently to discuss with the child and the guardians.",
  },

  {
    category: { name: "School/Hostel Visit" },
    warningLevel: WarningLevel.OK,
    subject: "School is happy about progress",
    text:
      "Visited the school and talked to the class teacher and principal. They are happy about the progress " +
      "and behaviour.",
  },
  {
    category: { name: "Talk with Coaching Teacher" },
    warningLevel: WarningLevel.WARNING,
    subject: "Needs to work more for school",
    text:
      "Discussed the child's progress with coaching teacher. He is still a weak student and needs more support. " +
      "We should consider arranging an extra class for him. Discuss next social worker meeting.",
  },

  {
    category: { name: "Incident" },
    warningLevel: WarningLevel.URGENT,
    subject: "Fight at school",
    text:
      "Principal called us today. Our student got into a fight and was suspended for a week. " +
      "Need to follow up with the child and discuss the matter.",
  },

  {
    category: { name: "Discussion/Decision", color: "#E1BEE7" },
    warningLevel: WarningLevel.OK,
    subject: "Special help for family",
    text:
      "Since the father has lost his job the family is struggling to survive. " +
      "After home visits and discussion in our team we decided to refer them to a special support programme.",
  },
  {
    category: { name: "Discussion/Decision", color: "#E1BEE7" },
    warningLevel: WarningLevel.OK,
    subject: "Chance to repeat class",
    text:
      "Child has failed this school year as she did not go to school regularly. " +
      "After a long discussion with the child and her parents we agreed to support her to repeat the class " +
      "and she promised to attend school regularly.",
  },

  {
    category: { name: "Talk with Child" },
    warningLevel: WarningLevel.WARNING,
    subject: "Distracted in class",
    text:
      "Teacher has let us know that he is very unfocused during class these days. " +
      "Discussed with him - there are a lot of problems in the family currently.",
  },
  {
    category: { name: "Talk with Child" },
    warningLevel: WarningLevel.WARNING,
    subject: "Disturbing class",
    text:
      "She refused to listen to the teacher was disturbing the class. " +
      "Did counselling session with her.",
  },
];
