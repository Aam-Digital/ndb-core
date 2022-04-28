import { Story, Meta } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { PwaInstallModule } from "./pwa-install.module";
import { StorybookBaseModule } from "app/utils/storybook-base.module";
import { PwaInstallComponent } from "./pwa-install.component";
import { MatSnackBarModule } from "@angular/material/snack-bar";

export default {
  title: "Core/PwaInstall",
  component: PwaInstallComponent,
  decorators: [
    moduleMetadata({
      imports: [
        PwaInstallModule,
        StorybookBaseModule,
        MatSnackBarModule
      ],
    }),
  ],
} as Meta;

const Template: Story<PwaInstallComponent> = (
  args: PwaInstallComponent
) => ({
  component: PwaInstallComponent,
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {
    installText2 : 'Install instructions',
};
