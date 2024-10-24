import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { StorybookBaseModule } from "app/utils/storybook-base.module";
import { PwaInstallComponent } from "./pwa-install.component";
import { PwaInstallService, PWAInstallType } from "./pwa-install.service";
import { importProvidersFrom } from "@angular/core";

export default {
  title: "Core/> App Layout/PwaInstall",
  component: PwaInstallComponent,
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(StorybookBaseModule),
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

const Template: StoryFn<PwaInstallComponent> = (args: PwaInstallComponent) => ({
  props: args,
});

export const Primary = {
  render: Template,

  args: {
    showPWAInstallButton: true,
  },
};
