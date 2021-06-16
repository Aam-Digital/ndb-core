import { Story, Meta } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { RouterTestingModule } from "@angular/router/testing";
import { Angulartics2Module } from "angulartics2";
import { FontAwesomeIconsModule } from "../../icons/font-awesome-icons.module";
import { DashboardShortcutWidgetModule } from "../dashboard-shortcut-widget.module";
import { DashboardShortcutWidgetComponent } from "./dashboard-shortcut-widget.component";
import { MenuItem } from "../../navigation/menu-item";

export default {
  title: "ShortcutDashboardWidget",
  component: DashboardShortcutWidgetComponent,
  decorators: [
    moduleMetadata({
      imports: [
        DashboardShortcutWidgetModule,
        FontAwesomeIconsModule,
        RouterTestingModule,
        Angulartics2Module.forRoot(),
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
      name: "Record Attendance",
      icon: "calendar-check-o",
      link: "/attendance/add/day",
    },
    {
      name: "All Notes",
      icon: "file-text",
      link: "/note",
    },
  ] as MenuItem[],
};
