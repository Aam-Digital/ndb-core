import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { importProvidersFrom } from "@angular/core";
import { NavigationMenuConfig } from "../../ui/navigation/menu-item";
import { AdminMenuComponent } from "./admin-menu.component";
import { Config } from "../../config/config";

const testConfig = new Config(Config.CONFIG_KEY, {
  navigationMenu: {
    items: [
      { label: "Home", icon: "home", link: "/" },
      { label: "About", icon: "info", link: "/about" },
      {
        label: "Contact",
        subMenu: [
          { label: "Email", icon: "envelope", link: "/contact/email" },
          { label: "Phone", icon: "phone", link: "/contact/phone" },
        ],
      },
    ],
  } as NavigationMenuConfig,
});

export default {
  title: "Core/Admin/Menu",
  component: AdminMenuComponent,
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(StorybookBaseModule.withData([testConfig])),
      ],
    }),
  ],
} as Meta<AdminMenuComponent>;

const Template: StoryFn<AdminMenuComponent> = (args: AdminMenuComponent) => ({
  props: { ...args },
});

export const Primary = Template.bind({});
Primary.args = {};
