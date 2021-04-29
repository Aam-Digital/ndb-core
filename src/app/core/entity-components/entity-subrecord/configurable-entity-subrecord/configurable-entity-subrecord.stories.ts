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
  nameOfObserver = "My name";
  firstQuestion = ratingAnswer[0];
}

export const Primary = Template.bind({});
Primary.args = {
  config: {
    cols: [
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
        additionalInfo: "Child admit own guilt in conflict situations.",
      },
    ],
  },
  records: [new Test(), new Test(), new Test()],
};
