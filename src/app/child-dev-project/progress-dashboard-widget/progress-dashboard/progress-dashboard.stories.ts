import { Story, Meta } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { ProgressDashboardWidgetModule } from "../progress-dashboard-widget.module";
import { ProgressDashboardComponent } from "./progress-dashboard.component";
import { ConfirmationDialogService } from "../../../core/confirmation-dialog/confirmation-dialog.service";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { ProgressDashboardConfig } from "./progress-dashboard-config";

const config = new ProgressDashboardConfig();
config.title = "Example Progress Dashboard";
config.parts = [
  { label: "First Entry", currentValue: 10, targetValue: 15 },
  { label: "Second Entry", currentValue: 2, targetValue: 10 },
  { label: "Third Entry", currentValue: 29, targetValue: 30 },
];

export default {
  title: "Child Dev Project/ProgressDashboardWidget",
  component: ProgressDashboardComponent,
  decorators: [
    moduleMetadata({
      imports: [ProgressDashboardWidgetModule],
      providers: [
        ConfirmationDialogService,
        {
          provide: EntityMapperService,
          useValue: { load: () => Promise.resolve(config) },
        },
      ],
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
