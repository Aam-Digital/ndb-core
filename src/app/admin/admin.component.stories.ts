import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { StorybookBaseModule } from "app/utils/storybook-base.module";
import { importProvidersFrom } from "@angular/core";
import { AdminComponent } from "./admin.component";
import { MenuItem } from "app/core/ui/navigation/menu-item";

export default {
  title: "Src/App/Admin",
  component: AdminComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(StorybookBaseModule)],
    }),
  ],
} as Meta<AdminComponent>;

const Template: StoryFn<AdminComponent> = (args: AdminComponent) => ({
  props: { ...args },
});

const testMenuItems: MenuItem[] = [
  { label: "Home", icon: "home", link: "/" },
  { label: "About", icon: "info", link: "/about" },
  { label: "Contact", icon: "question-circle", link: "/contact" },
];

export const Primary = Template.bind({});
Primary.args = {
  menuItems: testMenuItems,
};


