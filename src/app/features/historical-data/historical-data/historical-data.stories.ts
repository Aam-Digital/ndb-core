import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { HistoricalEntityData } from "../model/historical-entity-data";
import { HistoricalDataComponent } from "./historical-data.component";
import { HistoricalDataService } from "../historical-data.service";
import { ratingAnswers } from "../model/rating-answers";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { importProvidersFrom } from "@angular/core";
import { FormFieldConfig } from "../../../core/common-components/entity-form/FormConfig";

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
      editComponent: "EditDate",
      viewComponent: "DisplayDate",
    },
    {
      label: "Name of Observer",
      editComponent: "EditText",
      viewComponent: "DisplayText",
      id: "nameOfObserver",
    },
    {
      editComponent: "EditConfigurableEnum",
      viewComponent: "DisplayConfigurableEnum",
      id: "firstQuestion",
      label: "1. Question",
      additional: "rating-answer",
      description: "Child admits own guilt in conflict situations.",
    },
    {
      editComponent: "EditConfigurableEnum",
      viewComponent: "DisplayConfigurableEnum",
      id: "secondQuestion",
      label: "2. Question",
      additional: "rating-answer",
      description: "Child admits own guilt in conflict situations.",
    },
    {
      editComponent: "EditConfigurableEnum",
      viewComponent: "DisplayConfigurableEnum",
      id: "thirdQuestion",
      label: "3. Question",
      additional: "rating-answer",
      description: "Child admits own guilt in conflict situations.",
    },
    {
      editComponent: "EditConfigurableEnum",
      viewComponent: "DisplayConfigurableEnum",
      id: "fourthQuestion",
      label: "4. Question",
      additional: "rating-answer",
      description: "Child admits own guilt in conflict situations.",
    },
    {
      editComponent: "EditConfigurableEnum",
      viewComponent: "DisplayConfigurableEnum",
      id: "fifthQuestion",
      label: "5. Question",
      additional: "rating-answer",
      description: "Child admits own guilt in conflict situations.",
    },
    {
      editComponent: "EditConfigurableEnum",
      viewComponent: "DisplayConfigurableEnum",
      id: "sixthQuestion",
      label: "6. Question",
      additional: "rating-answer",
      description: "Child admits own guilt in conflict situations.",
    },
    {
      editComponent: "EditConfigurableEnum",
      viewComponent: "DisplayConfigurableEnum",
      id: "seventhQuestion",
      label: "7. Question",
      additional: "rating-answer",
      description: "Child admits own guilt in conflict situations.",
    },
    {
      editComponent: "EditConfigurableEnum",
      viewComponent: "DisplayConfigurableEnum",
      id: "eightQuestion",
      label: "8. Question",
      additional: "rating-answer",
      description: "Child admits own guilt in conflict situations.",
    },
    {
      editComponent: "EditConfigurableEnum",
      viewComponent: "DisplayConfigurableEnum",
      id: "ninthQuestion",
      label: "9. Question",
      additional: "rating-answer",
      description: "Child admits own guilt in conflict situations.",
    },
    {
      editComponent: "EditConfigurableEnum",
      viewComponent: "DisplayConfigurableEnum",
      id: "tenthQuestion",
      label: "10. Question",
      additional: "rating-answer",
      description: "Child admits own guilt in conflict situations.",
    },
  ] as FormFieldConfig[],
  entries: [new Test(), new Test(), new Test()],
  entity: new Test(),
};
