import {
  applicationConfig,
  Meta,
  moduleMetadata,
  StoryFn,
} from "@storybook/angular";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { importProvidersFrom } from "@angular/core";
import { ConfigFieldComponent } from "./config-field.component";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { EntitySchemaField } from "../../entity/schema/entity-schema-field";

export default {
  title: "Core/Admin UI/Config Field",
  component: ConfigFieldComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(StorybookBaseModule)],
    }),
    moduleMetadata({
      imports: [ConfigFieldComponent],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            entitySchemaField: { id: null },
          },
        },
        { provide: MatDialogRef, useValue: null },
      ],
    }),
  ],
} as Meta;

const Template: StoryFn<ConfigFieldComponent> = (args) => ({
  component: ConfigFieldComponent,
  props: args,
});

export const EditExisting = Template.bind({});
EditExisting.args = {
  entitySchemaField: {
    id: "name",
    dataType: "string",
    label: "Firstname",
    description: "abc",
  } as EntitySchemaField,
};

export const CreateNew = Template.bind({});
CreateNew.args = {
  entitySchemaField: { id: null } as EntitySchemaField,
};
