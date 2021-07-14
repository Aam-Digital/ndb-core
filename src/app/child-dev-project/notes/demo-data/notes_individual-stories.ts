import { warningLevels } from "../../warning-levels";

export const noteIndividualStories = [
  {
    category: "HOME_VISIT",
    warningLevel: warningLevels.find((level) => level.id === "WARNING"),
    subject: "Mother sick",
    text:
      "Visited family after we heard that mother is seriously ill. She cannot get up. " +
      "Children are taking care of housework. " +
      "Told her to see doctor. We should follow up next week.",
  },
  {
    category: "GUARDIAN_TALK",
    warningLevel: warningLevels.find((level) => level.id === "WARNING"),
    subject: "Discussed school change",
    text:
      "Discussed future of the child with the parents. They agree that changing school can be a good option. " +
      "Will discuss further together with the child.",
  },

  {
    category: "PHONE_CALL",
    warningLevel: warningLevels.find((level) => level.id === "OK"),
    subject: "Follow up for school absence",
    text: "Called to ask for reason about absence. Mother made excuses but promised to send the child tomorrow.",
  },
  {
    category: "PHONE_CALL",
    warningLevel: warningLevels.find((level) => level.id === "OK"),
    subject: "Absent because ill",
    text: "Mother has called in the morning. Child cannot come to class because of fever.",
  },
  {
    category: "PHONE_CALL",
    warningLevel: warningLevels.find((level) => level.id === "URGENT"),
    subject: "Absence without information",
    text:
      "Child was not in school whole last week again. When calling the mother she didn't know about it. " +
      "Need to follow up urgently to discuss with the child and the guardians.",
  },

  {
    category: "VISIT",
    warningLevel: warningLevels.find((level) => level.id === "OK"),
    subject: "School is happy about progress",
    text:
      "Visited the school and talked to the class teacher and principal. They are happy about the progress " +
      "and behaviour.",
  },
  {
    category: "COACHING_TALK",
    warningLevel: warningLevels.find((level) => level.id === "WARNING"),
    subject: "Needs to work more for school",
    text:
      "Discussed the child's progress with coaching teacher. He is still a weak student and needs more support. " +
      "We should consider arranging an extra class for him. Discuss next social worker meeting.",
  },

  {
    category: "INCIDENT",
    warningLevel: warningLevels.find((level) => level.id === "URGENT"),
    subject: "Fight at school",
    text:
      "Principal called us today. Our student got into a fight and was suspended for a week. " +
      "Need to follow up with the child and discuss the matter.",
  },

  {
    category: "DISCUSSION",
    warningLevel: warningLevels.find((level) => level.id === "OK"),
    subject: "Special help for family",
    text:
      "Since the father has lost his job the family is struggling to survive. " +
      "After home visits and discussion in our team we decided to refer them to a special support programme.",
  },
  {
    category: "DISCUSSION",
    warningLevel: warningLevels.find((level) => level.id === "OK"),
    subject: "Chance to repeat class",
    text:
      "Child has failed this school year as she did not go to school regularly. " +
      "After a long discussion with the child and her parents we agreed to support her to repeat the class " +
      "and she promised to attend school regularly.",
  },

  {
    category: "CHILD_TALK",
    warningLevel: warningLevels.find((level) => level.id === "WARNING"),
    subject: "Distracted in class",
    text:
      "Teacher has let us know that he is very unfocused during class these days. " +
      "Discussed with him - there are a lot of problems in the family currently.",
  },
  {
    category: "CHILD_TALK",
    warningLevel: warningLevels.find((level) => level.id === "WARNING"),
    subject: "Disturbing class",
    text:
      "She refused to listen to the teacher was disturbing the class. " +
      "Did counselling session with her.",
  },
];
