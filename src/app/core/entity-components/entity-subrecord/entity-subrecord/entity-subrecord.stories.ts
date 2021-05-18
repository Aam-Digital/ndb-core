import { moduleMetadata } from "@storybook/angular";
import { RouterTestingModule } from "@angular/router/testing";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { Meta, Story } from "@storybook/angular/types-6-0";
import { EntitySubrecordComponent } from "./entity-subrecord.component";
import { EntitySubrecordModule } from "../entity-subrecord.module";
import { Note } from "../../../../child-dev-project/notes/model/note";
import { EntityMapperService } from "../../../entity/entity-mapper.service";
import { DatePipe } from "@angular/common";
import { DemoNoteGeneratorService } from "../../../../child-dev-project/notes/demo-data/demo-note-generator.service";
import { ConfigService } from "../../../config/config.service";
import { EntitySchemaService } from "../../../entity/schema/entity-schema.service";
import { DemoChildGenerator } from "../../../../child-dev-project/children/demo-data-generators/demo-child-generator.service";
import { DemoUserGeneratorService } from "../../../user/demo-user-generator.service";
import { ColumnDescriptionInputType } from "../column-description-input-type.enum";
import { ConfigurableEnumDatatype } from "../../../configurable-enum/configurable-enum-datatype/configurable-enum-datatype";
import { MatNativeDateModule } from "@angular/material/core";
import { INTERACTION_TYPE_CONFIG_ID } from "../../../../child-dev-project/notes/model/interaction-type.interface";

const configService = new ConfigService();
const schemaService = new EntitySchemaService();
export default {
  title: "Core/EntitySubrecord",
  component: EntitySubrecordComponent,
  decorators: [
    moduleMetadata({
      imports: [
        EntitySubrecordModule,
        RouterTestingModule,
        BrowserAnimationsModule,
        MatNativeDateModule,
      ],
      providers: [
        {
          provide: EntityMapperService,
          useValue: { save: () => null, remove: () => null },
        },
        { provide: EntitySchemaService, useValue: schemaService },
        { provide: ConfigService, useValue: configService },
        DatePipe,
      ],
    }),
  ],
} as Meta;

const Template: Story<EntitySubrecordComponent<Note>> = (
  args: EntitySubrecordComponent<Note>
) => ({
  component: EntitySubrecordComponent,
  props: args,
});

schemaService.registerSchemaDatatype(
  new ConfigurableEnumDatatype(configService)
);
const childGenerator = new DemoChildGenerator({ count: 10 });
const userGenerator = new DemoUserGeneratorService();
const data = new DemoNoteGeneratorService(
  { minNotesPerChild: 5, maxNotesPerChild: 10, groupNotes: 2 },
  childGenerator,
  userGenerator,
  schemaService,
  configService
).generateEntities();

export const Primary = Template.bind({});
Primary.args = {
  columns: [
    {
      component: "EditDate",
      name: "date",
      label: "Date",
      inputType: ColumnDescriptionInputType.DATE,
    },
    {
      component: "EditText",
      name: "subject",
      label: "Subject",
      inputType: ColumnDescriptionInputType.TEXT,
    },
    {
      component: "EditConfigurableEnum",
      name: "category",
      label: "Category",
      inputType: ColumnDescriptionInputType.CONFIGURABLE_ENUM,
      enumId: INTERACTION_TYPE_CONFIG_ID,
    },
  ],
  records: data,
};
