import { warningLevels } from "../../warning-levels";
import { defaultInteractionTypes } from "../../../core/config/default-config/default-interaction-types";

export const noteIndividualStories = [
  {
    category: defaultInteractionTypes.find((t) => t.id === "VISIT"),
    warningLevel: warningLevels.find((level) => level.id === "WARNING"),
    subject: $localize`:Note demo subject:Mother sick`,
    text: $localize`:Note demo text:
        Visited family after we heard that mother is seriously ill. She cannot get up.
        Children are taking care of housework. Told her to see doctor. We should follow up next week.
      `,
  },
  {
    category: defaultInteractionTypes.find((t) => t.id === "GUARDIAN_TALK"),
    warningLevel: warningLevels.find((level) => level.id === "WARNING"),
    subject: $localize`:Note demo subject:Discussed school change`,
    text: $localize`:Note demo text:
        Discussed future of the child with the parents. They agree that changing school can be a good option.
        Will discuss further together with the child.
      `,
  },

  {
    category: defaultInteractionTypes.find((t) => t.id === "GUARDIAN_TALK"),
    warningLevel: warningLevels.find((level) => level.id === "OK"),
    subject: $localize`:Note demo subject:Follow up for school absence`,
    text: $localize`:Note demo text:
        Called to ask for reason about absence. Mother made excuses but promised to send the child tomorrow.
      `,
  },
  {
    category: defaultInteractionTypes.find((t) => t.id === "GUARDIAN_TALK"),
    warningLevel: warningLevels.find((level) => level.id === "OK"),
    subject: $localize`:Note demo subject:Absent because ill`,
    text: $localize`:Note demo text:
        Mother has called in the morning. Child cannot come to class because of fever.
      `,
  },
  {
    category: defaultInteractionTypes.find((t) => t.id === "GUARDIAN_TALK"),
    warningLevel: warningLevels.find((level) => level.id === "URGENT"),
    subject: $localize`:Note demo subject:Absence without information`,
    text: $localize`:Note demo text:
        Child was not in school whole last week again. When calling the mother she didn't know about it.
        Need to follow up urgently to discuss with the child and the guardians.
      `,
  },
  {
    category: defaultInteractionTypes.find((t) => t.id === "VISIT"),
    warningLevel: warningLevels.find((level) => level.id === "OK"),
    subject: $localize`:Note demo subject:School is happy about progress`,
    text: $localize`:Note demo text:
        Visited the school and talked to the class teacher and principal. They are happy about the progress
        and behaviour.
      `,
  },
  {
    category: defaultInteractionTypes.find((t) => t.id === "VISIT"),
    warningLevel: warningLevels.find((level) => level.id === "WARNING"),
    subject: $localize`:Note demo subject:Needs to work more for school`,
    text: $localize`:Note demo text:
        Discussed the child's progress with coaching teacher. He is still a weak student and needs more support.
        We should consider arranging an extra class for him. Discuss next social worker meeting.
      `,
  },
  {
    category: defaultInteractionTypes.find((t) => t.id === "INCIDENT"),
    warningLevel: warningLevels.find((level) => level.id === "URGENT"),
    subject: $localize`:Note demo subject:Fight at school`,
    text: $localize`:Note demo text:
        Principal called us today. Our student got into a fight and was suspended for a week.
        Need to follow up with the child and discuss the matter.
      `,
  },
  {
    category: defaultInteractionTypes.find((t) => t.id === "INCIDENT"),
    warningLevel: warningLevels.find((level) => level.id === "OK"),
    subject: $localize`:Note demo subject:Special help for family`,
    text: $localize`:Note demo text:
        Since the father has lost his job the family is struggling to survive.
        After home visits and discussion in our team we decided to refer them to a special support programme.
      `,
  },
  {
    category: defaultInteractionTypes.find((t) => t.id === "INCIDENT"),
    warningLevel: warningLevels.find((level) => level.id === "OK"),
    subject: $localize`:Note demo subject:Chance to repeat class`,
    text: $localize`:Note demo text:
        Child has failed this school year as she did not go to school regularly.
        After a long discussion with the child and her parents we agreed to support her to repeat the class
        and she promised to attend school regularly.
      `,
  },
  {
    category: defaultInteractionTypes.find((t) => t.id === "NOTE"),
    warningLevel: warningLevels.find((level) => level.id === "WARNING"),
    subject: $localize`:Note demo subject:Distracted in class`,
    text: $localize`:Note demo text:
        Teacher has let us know that he is very unfocused during class these days.
        Discussed with him - there are a lot of problems in the family currently.
      `,
  },
  {
    category: defaultInteractionTypes.find((t) => t.id === "NOTE"),
    warningLevel: warningLevels.find((level) => level.id === "WARNING"),
    subject: $localize`:Note demo subject:Disturbing class`,
    text: $localize`:Note demo text:
        She refused to listen to the teacher was disturbing the class.
        Did counselling session with her.
      `,
  },
];
