import { Story, Meta } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { RouterTestingModule } from "@angular/router/testing";
import { MatNativeDateModule } from "@angular/material/core";
import { Angulartics2Module } from "angulartics2";
import { FontAwesomeIconsModule } from "../../../icons/font-awesome-icons.module";
import { EntityMapperService } from "../../../entity/entity-mapper.service";
import { CommonModule, DatePipe } from "@angular/common";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { ConfigService } from "../../../config/config.service";
import { MatFormFieldModule } from "@angular/material/form-field";
import { HistoricalEntityData } from "../historical-entity-data";
import { HistoricalDataComponent } from "./historical-data.component";
import { HistoricalDataModule } from "../historical-data.module";
import { ColumnDescriptionInputType } from "../../entity-subrecord/column-description-input-type.enum";

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
      label: "Date",
      name: "date",
      inputType: ColumnDescriptionInputType.DATE,
    },
    {
      label: "Name of Observer",
      inputType: ColumnDescriptionInputType.TEXT,
      name: "nameOfObserver",
    },
    {
      inputType: ColumnDescriptionInputType.CONFIGURABLE_ENUM,
      name: "firstQuestion",
      label: "1. Question",
      enumId: "rating-answer",
      tooltip: "Child admits sown guilt in conflict situations.",
      valueFunction: (entity) => entity["firstQuestion"].label,
    },
    {
      inputType: ColumnDescriptionInputType.CONFIGURABLE_ENUM,
      name: "secondQuestion",
      label: "2. Question",
      enumId: "rating-answer",
      tooltip: "Child admits sown guilt in conflict situations.",
      valueFunction: (entity) => entity["secondQuestion"].label,
    },
    {
      inputType: ColumnDescriptionInputType.CONFIGURABLE_ENUM,
      name: "thirdQuestion",
      label: "3. Question",
      enumId: "rating-answer",
      tooltip: "Child admits sown guilt in conflict situations.",
      valueFunction: (entity) => entity["thirdQuestion"].label,
    },
    {
      inputType: ColumnDescriptionInputType.CONFIGURABLE_ENUM,
      name: "fourthQuestion",
      label: "4. Question",
      enumId: "rating-answer",
      tooltip: "Child admits sown guilt in conflict situations.",
      valueFunction: (entity) => entity["fourthQuestion"].label,
    },
    {
      inputType: ColumnDescriptionInputType.CONFIGURABLE_ENUM,
      name: "fifthQuestion",
      label: "5. Question",
      enumId: "rating-answer",
      tooltip: "Child admits sown guilt in conflict situations.",
      valueFunction: (entity) => entity["fifthQuestion"].label,
    },
    {
      inputType: ColumnDescriptionInputType.CONFIGURABLE_ENUM,
      name: "sixthQuestion",
      label: "6. Question",
      enumId: "rating-answer",
      tooltip: "Child admits sown guilt in conflict situations.",
      valueFunction: (entity) => entity["sixthQuestion"].label,
    },
    {
      inputType: ColumnDescriptionInputType.CONFIGURABLE_ENUM,
      name: "seventhQuestion",
      label: "7. Question",
      enumId: "rating-answer",
      tooltip: "Child admits sown guilt in conflict situations.",
      valueFunction: (entity) => entity["seventhQuestion"].label,
    },
    {
      inputType: ColumnDescriptionInputType.CONFIGURABLE_ENUM,
      name: "eightQuestion",
      label: "8. Question",
      enumId: "rating-answer",
      tooltip: "Child admits sown guilt in conflict situations.",
      valueFunction: (entity) => entity["eightQuestion"].label,
    },
    {
      inputType: ColumnDescriptionInputType.CONFIGURABLE_ENUM,
      name: "ninthQuestion",
      label: "9. Question",
      enumId: "rating-answer",
      tooltip: "Child admits sown guilt in conflict situations.",
      valueFunction: (entity) => entity["ninthQuestion"].label,
    },
    {
      inputType: ColumnDescriptionInputType.CONFIGURABLE_ENUM,
      name: "tenthQuestion",
      label: "10. Question",
      enumId: "rating-answer",
      tooltip: "Child admits sown guilt in conflict situations.",
      valueFunction: (entity) => entity["tenthQuestion"].label,
    },
  ],
  entries: [new Test(), new Test(), new Test()],
};
