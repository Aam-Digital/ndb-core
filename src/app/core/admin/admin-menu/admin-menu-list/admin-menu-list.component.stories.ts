import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { StorybookBaseModule } from "app/utils/storybook-base.module";
import { importProvidersFrom } from "@angular/core";
import { AdminMenuListComponent } from "./admin-menu-list.component";
import { MenuItem } from "app/core/ui/navigation/menu-item";

export default {
  title: "Src/App/Admin",
  component: AdminMenuListComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(StorybookBaseModule)],
    }),
  ],
} as Meta<AdminMenuListComponent>;

const Template: StoryFn<AdminMenuListComponent> = (args: AdminMenuListComponent) => ({
  props: { ...args },
});

const testMenuItems: MenuItem[] = [
  { label: "Home", icon: "home", link: "/" },
  { label: "About", icon: "info", link: "/about" },
  { label: "Contact", icon: "question-circle", link: "/contact", subMenu: [
      { label: "Email", icon: "envelope", link: "/contact/email" },
      { label: "Phone", icon: "phone", link: "/contact/phone" },
    ]
  },
];

export const Primary = Template.bind({});
Primary.args = {
  menuItems: testMenuItems,
};


