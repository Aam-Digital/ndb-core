import { Meta, Story } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { HealthCheckupComponent } from "./health-checkup.component";
import { ChildrenService } from "../../children.service";
import { HealthCheck } from "../model/health-check";
import moment from "moment";
import { Child } from "../../model/child";
import { of } from "rxjs";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";
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
    moduleMetadata({
      imports: [
        HealthCheckupComponent,
        StorybookBaseModule,
        MockedTestingModule.withState(),
      ],
      declarations: [],
      providers: [
        {
          provide: ChildrenService,
          useValue: { getHealthChecksOfChild: () => of([hc1, hc2, hc3]) },
        },
      ],
    }),
  ],
} as Meta;

const Template: Story<HealthCheckupComponent> = (
  args: HealthCheckupComponent
) => ({
  component: HealthCheckupComponent,
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {
  child: new Child(),
};
