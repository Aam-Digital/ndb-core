import { Story, Meta } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { RouterTestingModule } from "@angular/router/testing";
import { MatNativeDateModule } from "@angular/material/core";
import { Angulartics2Module } from "angulartics2";
import { FontAwesomeIconsModule } from "../../../core/icons/font-awesome-icons.module";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { CommonModule, DatePipe } from "@angular/common";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { ConfigService } from "../../../core/config/config.service";
import { MatFormFieldModule } from "@angular/material/form-field";
import { HistoricalEntityData } from "../historical-entity-data";
import { HistoricalDataComponent } from "./historical-data.component";
import { HistoricalDataModule } from "../historical-data.module";
import { HistoricalDataService } from "../historical-data.service";
import { EntityPermissionsService } from "../../../core/permissions/entity-permissions.service";

export default {
  title: "Core/EntityComponents/HistoricalDataComponent",
  component: HistoricalDataComponent,
  decorators: [
    moduleMetadata({
      imports: [
        HistoricalDataModule,
        FontAwesomeIconsModule,
        RouterTestingModule,
        MatNativeDateModule,
        Angulartics2Module.forRoot(),
        CommonModule,
        NoopAnimationsModule,
        MatFormFieldModule,
      ],
      declarations: [],
      providers: [
        {
          provide: EntityMapperService,
          useValue: { save: () => Promise.resolve() },
        },
        DatePipe,
        {
          provide: ConfigService,
          useValue: { getConfig: () => ratingAnswer },
        },
        {
          provide: HistoricalDataService,
          useValue: {
            getHistoricalDataFor: () =>
              Promise.resolve([new Test(), new Test(), new Test()]),
          },
        },
        {
          provide: EntityPermissionsService,
          useValue: { userIsPermitted: () => true },
        },
      ],
    }),
  ],
} as Meta;

const Template: Story<HistoricalDataComponent> = (
  args: HistoricalDataComponent
) => ({
  component: HistoricalDataComponent,
  props: args,
});

const ratingAnswer = [
  {
    id: "notTrueAtAll",
    label: "not true at all",
  },
  {
    id: "rarelyTrue",
    label: "rarely true",
  },
  {
    id: "usuallyTrue",
    label: "usually true",
  },
  {
    id: "absolutelyTrue",
    label: "absolutelyTrue",
  },
  {
    id: "noAnswerPossible",
    label: "no answer possible",
  },
];

class Test extends HistoricalEntityData {
  date = new Date();
  nameOfObserver = "My name";
  firstQuestion = ratingAnswer[0];
  secondQuestion = ratingAnswer[1];
  thirdQuestion = ratingAnswer[2];
  fourthQuestion = ratingAnswer[3];
  fifthQuestion = ratingAnswer[4];
  sixthQuestion = ratingAnswer[0];
  seventhQuestion = ratingAnswer[1];
  eightQuestion = ratingAnswer[2];
  ninthQuestion = ratingAnswer[3];
  tenthQuestion = ratingAnswer[4];
}

export const Primary = Template.bind({});
Primary.args = {
  columns: [
    {
      placeholder: "Date",
      id: "date",
      edit: "EditDate",
      view: "DisplayDate",
    },
    {
      placeholder: "Name of Observer",
      edit: "EditText",
      view: "DisplayText",
      id: "nameOfObserver",
    },
    {
      edit: "EditConfigurableEnum",
      view: "DisplayConfigurableEnum",
      id: "firstQuestion",
      placeholder: "1. Question",
      additional: "rating-answer",
      tooltip: "Child admits own guilt in conflict situations.",
    },
    {
      edit: "EditConfigurableEnum",
      view: "DisplayConfigurableEnum",
      id: "secondQuestion",
      placeholder: "2. Question",
      additional: "rating-answer",
      tooltip: "Child admits own guilt in conflict situations.",
    },
    {
      edit: "EditConfigurableEnum",
      view: "DisplayConfigurableEnum",
      id: "thirdQuestion",
      placeholder: "3. Question",
      additional: "rating-answer",
      tooltip: "Child admits own guilt in conflict situations.",
    },
    {
      edit: "EditConfigurableEnum",
      view: "DisplayConfigurableEnum",
      id: "fourthQuestion",
      placeholder: "4. Question",
      additional: "rating-answer",
      tooltip: "Child admits own guilt in conflict situations.",
    },
    {
      edit: "EditConfigurableEnum",
      view: "DisplayConfigurableEnum",
      id: "fifthQuestion",
      placeholder: "5. Question",
      additional: "rating-answer",
      tooltip: "Child admits own guilt in conflict situations.",
    },
    {
      edit: "EditConfigurableEnum",
      view: "DisplayConfigurableEnum",
      id: "sixthQuestion",
      placeholder: "6. Question",
      additional: "rating-answer",
      tooltip: "Child admits own guilt in conflict situations.",
    },
    {
      edit: "EditConfigurableEnum",
      view: "DisplayConfigurableEnum",
      id: "seventhQuestion",
      placeholder: "7. Question",
      additional: "rating-answer",
      tooltip: "Child admits own guilt in conflict situations.",
    },
    {
      edit: "EditConfigurableEnum",
      view: "DisplayConfigurableEnum",
      id: "eightQuestion",
      placeholder: "8. Question",
      additional: "rating-answer",
      tooltip: "Child admits own guilt in conflict situations.",
    },
    {
      edit: "EditConfigurableEnum",
      view: "DisplayConfigurableEnum",
      id: "ninthQuestion",
      placeholder: "9. Question",
      additional: "rating-answer",
      tooltip: "Child admits own guilt in conflict situations.",
    },
    {
      edit: "EditConfigurableEnum",
      view: "DisplayConfigurableEnum",
      id: "tenthQuestion",
      placeholder: "10. Question",
      additional: "rating-answer",
      tooltip: "Child admits own guilt in conflict situations.",
    },
  ],
  entries: [new Test(), new Test(), new Test()],
  entity: new Test(),
};
