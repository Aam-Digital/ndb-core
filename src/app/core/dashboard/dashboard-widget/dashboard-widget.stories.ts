import { Story, Meta } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { DashboardModule } from "../dashboard.module";
import { DashboardWidgetComponent } from "./dashboard-widget.component";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";

export default {
  title: "Core/Dashboards/Dashboard Base Widget",
  component: DashboardWidgetComponent,
  decorators: [
    moduleMetadata({
      imports: [DashboardModule, StorybookBaseModule],
    }),
  ],
} as Meta;

const Template: Story<DashboardWidgetComponent> = (
  args: DashboardWidgetComponent
) => ({
  component: DashboardWidgetComponent,
  props: args,
});

export const Default = Template.bind({});
Default.args = {
  title: "111",
  subtitle: "of all numbers",
  icon: "child",
  theme: "child",
  explanation: "this is a demo tooltip",
};

export const Loading = Template.bind({});
Loading.args = {
  title: "111",
  subtitle: "of all numbers",
  icon: "child",
  theme: "child",
  _loading: true,
};
