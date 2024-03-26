import {
  applicationConfig,
  Meta,
  moduleMetadata,
  StoryFn,
} from "@storybook/angular";
import { importProvidersFrom } from "@angular/core";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { SetupWizardComponent } from "./setup-wizard.component";

export default {
  title: "Core/Admin/Setup Wizard",
  component: SetupWizardComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(StorybookBaseModule)],
    }),
    moduleMetadata({
      imports: [SetupWizardComponent],
    }),
  ],
} as Meta;

const Template: StoryFn<SetupWizardComponent> = (args) => ({
  component: SetupWizardComponent,
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {};
