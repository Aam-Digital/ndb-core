import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { DashboardShortcutWidgetComponent } from "./dashboard-shortcut-widget.component";
import { MenuItem } from "../../navigation/menu-item";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { importProvidersFrom } from "@angular/core";

export default {
  title: "Core/Dashboards/ShortcutDashboardWidget",
  component: DashboardShortcutWidgetComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(StorybookBaseModule)],
    }),
  ],
} as Meta;

const Template: StoryFn<DashboardShortcutWidgetComponent> = (
  args: DashboardShortcutWidgetComponent,
) => ({
  component: DashboardShortcutWidgetComponent,
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
