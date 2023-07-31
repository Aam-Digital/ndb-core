import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { HistoricalEntityData } from "../model/historical-entity-data";
import { HistoricalDataComponent } from "./historical-data.component";
import { HistoricalDataService } from "../historical-data.service";
import { ratingAnswers } from "../model/rating-answers";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { importProvidersFrom } from "@angular/core";

export default {
  title: "Features/HistoricalDataComponent",
  component: HistoricalDataComponent,
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(StorybookBaseModule),
        {
          provide: HistoricalDataService,
          useValue: {
            getHistoricalDataFor: () =>
              Promise.resolve([new Test(), new Test(), new Test()]),
          },
        },
      ],
    }),
  ],
} as Meta;

const Template: StoryFn<HistoricalDataComponent> = (
  args: HistoricalDataComponent,
) => ({
  component: HistoricalDataComponent,
  props: args,
});

class Test extends HistoricalEntityData {
  date = new Date();
  nameOfObserver = "My name";
  firstQuestion = ratingAnswers[0];
  secondQuestion = ratingAnswers[1];
  thirdQuestion = ratingAnswers[2];
  fourthQuestion = ratingAnswers[3];
  fifthQuestion = ratingAnswers[4];
  sixthQuestion = ratingAnswers[0];
  seventhQuestion = ratingAnswers[1];
  eightQuestion = ratingAnswers[2];
  ninthQuestion = ratingAnswers[3];
  tenthQuestion = ratingAnswers[4];
}

export const Primary = Template.bind({});
Primary.args = {
  columns: [
    {
      label: "Date",
      id: "date",
      edit: "EditDate",
      view: "DisplayDate",
    },
    {
      label: "Name of Observer",
      edit: "EditText",
      view: "DisplayText",
      id: "nameOfObserver",
    },
    {
      edit: "EditConfigurableEnum",
      view: "DisplayConfigurableEnum",
      id: "firstQuestion",
      label: "1. Question",
      additional: "rating-answer",
      tooltip: "Child admits own guilt in conflict situations.",
    },
    {
      edit: "EditConfigurableEnum",
      view: "DisplayConfigurableEnum",
      id: "secondQuestion",
      label: "2. Question",
      additional: "rating-answer",
      tooltip: "Child admits own guilt in conflict situations.",
    },
    {
      edit: "EditConfigurableEnum",
      view: "DisplayConfigurableEnum",
      id: "thirdQuestion",
      label: "3. Question",
      additional: "rating-answer",
      tooltip: "Child admits own guilt in conflict situations.",
    },
    {
      edit: "EditConfigurableEnum",
      view: "DisplayConfigurableEnum",
      id: "fourthQuestion",
      label: "4. Question",
      additional: "rating-answer",
      tooltip: "Child admits own guilt in conflict situations.",
    },
    {
      edit: "EditConfigurableEnum",
      view: "DisplayConfigurableEnum",
      id: "fifthQuestion",
      label: "5. Question",
      additional: "rating-answer",
      tooltip: "Child admits own guilt in conflict situations.",
    },
    {
      edit: "EditConfigurableEnum",
      view: "DisplayConfigurableEnum",
      id: "sixthQuestion",
      label: "6. Question",
      additional: "rating-answer",
      tooltip: "Child admits own guilt in conflict situations.",
    },
    {
      edit: "EditConfigurableEnum",
      view: "DisplayConfigurableEnum",
      id: "seventhQuestion",
      label: "7. Question",
      additional: "rating-answer",
      tooltip: "Child admits own guilt in conflict situations.",
    },
    {
      edit: "EditConfigurableEnum",
      view: "DisplayConfigurableEnum",
      id: "eightQuestion",
      label: "8. Question",
      additional: "rating-answer",
      tooltip: "Child admits own guilt in conflict situations.",
    },
    {
      edit: "EditConfigurableEnum",
      view: "DisplayConfigurableEnum",
      id: "ninthQuestion",
      label: "9. Question",
      additional: "rating-answer",
      tooltip: "Child admits own guilt in conflict situations.",
    },
    {
      edit: "EditConfigurableEnum",
      view: "DisplayConfigurableEnum",
      id: "tenthQuestion",
      label: "10. Question",
      additional: "rating-answer",
      tooltip: "Child admits own guilt in conflict situations.",
    },
  ],
  entries: [new Test(), new Test(), new Test()],
  entity: new Test(),
};
