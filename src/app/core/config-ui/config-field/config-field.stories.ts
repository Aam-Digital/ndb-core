import {
  applicationConfig,
  Meta,
  moduleMetadata,
  StoryFn,
} from "@storybook/angular";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { importProvidersFrom } from "@angular/core";
import { ConfigFieldComponent } from "./config-field.component";
import { Child } from "../../../child-dev-project/children/model/child";
import { FormFieldConfig } from "../../common-components/entity-form/entity-form/FormConfig";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";

const sampleFieldConfig: FormFieldConfig = {
  id: "name",
  edit: "EditText",
  view: "DisplayText",
  forTable: false,
  label: "Name",
  validators: {
    required: true,
  },
};

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
            entityType: Child,
            formFieldConfig: sampleFieldConfig,
          },
        },
      ],
    }),
  ],
} as Meta;

const Template: StoryFn<ConfigFieldComponent> = (args) => ({
  component: ConfigFieldComponent,
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {};
