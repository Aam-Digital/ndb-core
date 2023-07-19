import { Story, Meta } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { RouterTestingModule } from "@angular/router/testing";
import { DashboardShortcutWidgetComponent } from "./dashboard-shortcut-widget.component";
import { MenuItem } from "../../navigation/menu-item";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";

export default {
  title: "Core/Dashboards/ShortcutDashboardWidget",
  component: DashboardShortcutWidgetComponent,
  decorators: [
    moduleMetadata({
      imports: [
        RouterTestingModule,
        StorybookBaseModule,
        DashboardShortcutWidgetComponent,
      ],
    }),
  ],
} as Meta;

const Template: Story<DashboardShortcutWidgetComponent> = (
  args: DashboardShortcutWidgetComponent
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
