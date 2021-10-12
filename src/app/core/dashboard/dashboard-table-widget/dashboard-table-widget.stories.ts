import { Story, Meta } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { FontAwesomeIconsModule } from "../../icons/font-awesome-icons.module";
import { DashboardModule } from "../dashboard.module";
import { DashboardTableWidgetComponent } from "./dashboard-table-widget.component";

export default {
  title: "Core/Dashboard Table Widget",
  component: DashboardTableWidgetComponent,
  decorators: [
    moduleMetadata({
      imports: [
        DashboardModule,
        BrowserAnimationsModule,
        FontAwesomeIconsModule,
      ],
    }),
  ],
} as Meta;

const Template: Story<DashboardTableWidgetComponent> = (
  args: DashboardTableWidgetComponent
) => ({
  component: DashboardTableWidgetComponent,
  props: args,
});

export const Default = Template.bind({});
Default.args = {
  subtitle: "of all numbers",
  explanation: "a demo explanation tooltip",
  icon: "child",
  theme: "child",
  data: [{}, {}],
};
