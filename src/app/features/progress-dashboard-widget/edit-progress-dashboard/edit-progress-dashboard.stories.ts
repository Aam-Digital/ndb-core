import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { ProgressDashboardComponent } from "../progress-dashboard/progress-dashboard.component";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { importProvidersFrom } from "@angular/core";

export default {
  title: "Features/Dashboards/Progress Dashboard Widget",
  component: ProgressDashboardComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(StorybookBaseModule.withData())],
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
Primary.args = {};
