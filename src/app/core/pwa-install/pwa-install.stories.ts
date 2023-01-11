import { Story, Meta } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { StorybookBaseModule } from "app/utils/storybook-base.module";
import { PwaInstallComponent } from "./pwa-install.component";

export default {
  title: "Core/PwaInstall",
  component: PwaInstallComponent,
  decorators: [
    moduleMetadata({
      imports: [PwaInstallComponent, StorybookBaseModule],
    }),
  ],
} as Meta;

const Template: Story<PwaInstallComponent> = (args: PwaInstallComponent) => ({
  component: PwaInstallComponent,
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {
  installText2: "Install instructions",
};
