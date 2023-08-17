import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { StorybookBaseModule } from "../../../../utils/storybook-base.module";
import { importProvidersFrom } from "@angular/core";
import { ShortcutDashboardComponent } from "./shortcut-dashboard.component";
import { MenuItem } from "../../../../core/navigation/menu-item";

export default {
  title: "Features/Dashboard Widgets/Shortcut Dashboard",
  component: ShortcutDashboardComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(StorybookBaseModule)],
    }),
  ],
} as Meta;

const Template: StoryFn<ShortcutDashboardComponent> = (
  args: ShortcutDashboardComponent,
) => ({
  component: ShortcutDashboardComponent,
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {
  shortcuts: [
    {
      label: "Record Attendance",
      icon: "calendar-check-o",
      link: "/attendance/add-day",
    },
    {
      label: "All Notes",
      icon: "file-text",
      link: "/note",
    },
  ] as MenuItem[],
};
