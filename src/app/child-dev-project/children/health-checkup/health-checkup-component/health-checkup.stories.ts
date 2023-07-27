import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { HealthCheckupComponent } from "./health-checkup.component";
import { ChildrenService } from "../../children.service";
import { HealthCheck } from "../model/health-check";
import moment from "moment";
import { Child } from "../../model/child";
import { importProvidersFrom } from "@angular/core";
import { StorybookBaseModule } from "../../../../utils/storybook-base.module";

const hc1 = new HealthCheck();
hc1.date = new Date();
hc1.height = 200;
hc1.weight = 70;
const hc2 = new HealthCheck();
hc2.date = moment().subtract(1, "year").toDate();
hc2.height = 178;
hc2.weight = 65;
const hc3 = new HealthCheck();
hc3.date = moment().subtract(2, "years").toDate();
hc3.height = 175;
hc3.weight = 80;

export default {
  title: "Features/Health Checkup",
  component: HealthCheckupComponent,
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(StorybookBaseModule.withData()),
        {
          provide: ChildrenService,
          useValue: {
            getHealthChecksOfChild: () => Promise.resolve([hc1, hc2, hc3]),
          },
        },
      ],
    }),
  ],
} as Meta;

const Template: StoryFn<HealthCheckupComponent> = (
  args: HealthCheckupComponent,
) => ({
  component: HealthCheckupComponent,
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {
  entity: new Child(),
};
