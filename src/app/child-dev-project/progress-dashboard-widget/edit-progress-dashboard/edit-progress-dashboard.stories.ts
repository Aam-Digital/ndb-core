import { Story, Meta } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { RouterTestingModule } from "@angular/router/testing";
import { ProgressDashboardWidgetModule } from "../progress-dashboard-widget.module";
import { ProgressDashboardComponent } from "../progress-dashboard/progress-dashboard.component";
import { MockSessionModule } from "../../../core/session/mock-session.module";

export default {
  title: "Features/Progress Dashboard Widget",
  component: ProgressDashboardComponent,
  decorators: [
    moduleMetadata({
      imports: [
        RouterTestingModule,
        ProgressDashboardWidgetModule,
        MockSessionModule.withState(),
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
