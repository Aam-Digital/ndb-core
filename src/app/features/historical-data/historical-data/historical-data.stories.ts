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
import { ColumnDescriptionInputType } from "../../../core/entity-components/entity-subrecord/column-description-input-type.enum";
import { ratingAnswers } from "../rating-answers";

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
          useValue: { getConfig: () => ratingAnswers },
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
