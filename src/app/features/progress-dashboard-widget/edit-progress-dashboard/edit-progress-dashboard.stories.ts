import { Meta, moduleMetadata, StoryFn } from "@storybook/angular";
import { ProgressDashboardComponent } from "../progress-dashboard/progress-dashboard.component";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";

export default {
  title: "Features/Dashboards/Progress Dashboard Widget",
  component: ProgressDashboardComponent,
  decorators: [
    moduleMetadata({
      imports: [
        ProgressDashboardComponent,
        StorybookBaseModule,
        MockedTestingModule.withState(),
      ],
      declarations: [],
      providers: [],
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
