import { applicationConfig, Meta, StoryFn, StoryObj } from "@storybook/angular";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { ImportFileComponent } from "./import-file.component";
import { IMPORT_SAMPLE_RAW_DATA } from "../import/import-sample-raw-data";
import { importProvidersFrom } from "@angular/core";

export default {
  title: "Features/Import/1 Select File",
  component: ImportFileComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(StorybookBaseModule)],
    }),
  ],
} as Meta;

export const Basic: StoryObj<ImportFileComponent> = {
  args: {},
};

export const WithSampleData = {
  args: {
    // TODO: this is not an official @Input() of the component, may cause issues in storybook
    data: IMPORT_SAMPLE_RAW_DATA,
  },
};
