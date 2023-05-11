import { Meta, Story } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { StorybookBaseModule } from "app/utils/storybook-base.module";
import { PwaInstallComponent } from "./pwa-install.component";
import { PwaInstallService, PWAInstallType } from "./pwa-install.service";

export default {
  title: "Core/PwaInstall",
  component: PwaInstallComponent,
  decorators: [
    moduleMetadata({
      imports: [PwaInstallComponent, StorybookBaseModule],
      providers: [
        {
          provide: PwaInstallService,
          useValue: {
            getPWAInstallType: () => PWAInstallType.ShowiOSInstallInstructions,
          },
        },
      ],
    }),
  ],
} as Meta;

const Template: Story<PwaInstallComponent> = (args: PwaInstallComponent) => ({
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {
  showPWAInstallButton: true,
};
