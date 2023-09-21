import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { ProgressDashboardComponent } from "./progress-dashboard.component";
import { StorybookBaseModule } from "../../../../utils/storybook-base.module";
import { importProvidersFrom } from "@angular/core";
import { ProgressDashboardConfig } from "./progress-dashboard-config";

export default {
  title: "Features/Dashboard Widgets/Progress Dashboard",
  component: ProgressDashboardComponent,
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(
          StorybookBaseModule.withData([
            Object.assign(new ProgressDashboardConfig("1"), {
              title: "surveys completed",
              parts: [
                { label: "Berlin", currentValue: 41, targetValue: 80 },
                { label: "New York", currentValue: 17, targetValue: 40 },
              ],
            } as ProgressDashboardConfig),
          ]),
        ),
      ],
    }),
  ],
} as Meta;

const Template: StoryFn<ProgressDashboardComponent> = (
  args: ProgressDashboardComponent,
) => ({
  component: ProgressDashboardComponent,
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {
  dashboardConfigId: "1",
};
