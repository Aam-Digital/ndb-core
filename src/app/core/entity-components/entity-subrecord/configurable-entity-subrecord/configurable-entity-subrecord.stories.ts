import { Story, Meta } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { RouterTestingModule } from "@angular/router/testing";
import { MatNativeDateModule } from "@angular/material/core";
import { Angulartics2Module } from "angulartics2";
import { ConfigurableEntitySubrecordComponent } from "./configurable-entity-subrecord.component";
import { EntitySubrecordModule } from "../entity-subrecord.module";
import { FontAwesomeIconsModule } from "../../../icons/font-awesome-icons.module";
import { EntityMapperService } from "../../../entity/entity-mapper.service";
import { CommonModule, DatePipe } from "@angular/common";
import { Entity } from "../../../entity/entity";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { ConfigService } from "../../../config/config.service";
import { MatFormFieldModule } from "@angular/material/form-field";

export default {
  title: "Core/EntityComponents/ConfigurableEntitySubrecord",
  component: ConfigurableEntitySubrecordComponent,
  decorators: [
    moduleMetadata({
      imports: [
        EntitySubrecordModule,
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

const Template: Story<ConfigurableEntitySubrecordComponent> = (
  args: ConfigurableEntitySubrecordComponent
) => ({
  component: ConfigurableEntitySubrecordComponent,
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

class Test extends Entity {
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
  config: {
    cols: [
      {
        placeholder: "Date",
        input: "date",
        id: "date",
      },
      {
        placeholder: "Name of Observer",
        input: "text",
        id: "nameOfObserver",
      },
      {
        input: "configurable-enum-select",
        id: "firstQuestion",
        placeholder: "1. Question",
        enumId: "rating-answer",
        additionalInfo: "Child admits sown guilt in conflict situations.",
      },
      {
        input: "configurable-enum-select",
        id: "secondQuestion",
        placeholder: "2. Question",
        enumId: "rating-answer",
        additionalInfo: "Child admits sown guilt in conflict situations.",
      },
      {
        input: "configurable-enum-select",
        id: "thirdQuestion",
        placeholder: "3. Question",
        enumId: "rating-answer",
        additionalInfo: "Child admits sown guilt in conflict situations.",
      },
      {
        input: "configurable-enum-select",
        id: "fourthQuestion",
        placeholder: "4. Question",
        enumId: "rating-answer",
        additionalInfo: "Child admits sown guilt in conflict situations.",
      },
      {
        input: "configurable-enum-select",
        id: "fifthQuestion",
        placeholder: "5. Question",
        enumId: "rating-answer",
        additionalInfo: "Child admits sown guilt in conflict situations.",
      },
      {
        input: "configurable-enum-select",
        id: "sixthQuestion",
        placeholder: "6. Question",
        enumId: "rating-answer",
        additionalInfo: "Child admits sown guilt in conflict situations.",
      },
      {
        input: "configurable-enum-select",
        id: "seventhQuestion",
        placeholder: "7. Question",
        enumId: "rating-answer",
        additionalInfo: "Child admits sown guilt in conflict situations.",
      },
      {
        input: "configurable-enum-select",
        id: "eightQuestion",
        placeholder: "8. Question",
        enumId: "rating-answer",
        additionalInfo: "Child admits sown guilt in conflict situations.",
      },
      {
        input: "configurable-enum-select",
        id: "ninthQuestion",
        placeholder: "9. Question",
        enumId: "rating-answer",
        additionalInfo: "Child admits sown guilt in conflict situations.",
      },
      {
        input: "configurable-enum-select",
        id: "tenthQuestion",
        placeholder: "10. Question",
        enumId: "rating-answer",
        additionalInfo: "Child admits sown guilt in conflict situations.",
      },
    ],
  },
  records: [new Test(), new Test(), new Test()],
};
