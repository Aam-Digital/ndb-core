import { Story, Meta } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { ProgressDashboardWidgetModule } from "../progress-dashboard-widget.module";
import { ProgressDashboardComponent } from "../progress-dashboard/progress-dashboard.component";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";

export default {
  title: "Features/Progress Dashboard Widget",
  component: ProgressDashboardComponent,
  decorators: [
    moduleMetadata({
      imports: [
        ProgressDashboardWidgetModule,
        StorybookBaseModule,
        MockedTestingModule.withState(),
      ],
      declarations: [],
      providers: [],
    }),
  ],
} as Meta;

const Template: Story<ProgressDashboardComponent> = (
  args: ProgressDashboardComponent
) => ({
  component: ProgressDashboardComponent,
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {};
