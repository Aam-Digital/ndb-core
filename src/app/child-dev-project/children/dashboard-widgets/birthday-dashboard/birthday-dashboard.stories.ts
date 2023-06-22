import { Meta, Story } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { BirthdayDashboardComponent } from "./birthday-dashboard.component";
import { StorybookBaseModule } from "../../../../utils/storybook-base.module";
import { LoginState } from "../../../../core/session/session-states/login-state.enum";
import { Child } from "../../model/child";
import moment from "moment";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";
import { DateWithAge } from "../../model/dateWithAge";

const child1 = Child.create("First Child");
child1.dateOfBirth = new DateWithAge(
  moment().subtract(10, "years").add("10", "days").toDate()
);
const child2 = Child.create("Second Child");
child2.dateOfBirth = new DateWithAge(
  moment().subtract(9, "years").add("1", "month").toDate()
);
const child3 = Child.create("Third Child");
child3.dateOfBirth = new DateWithAge(
  moment().subtract(11, "years").add("40", "days").toDate()
);
const child4 = Child.create("Fifth Child");
child4.dateOfBirth = new DateWithAge(
  moment().subtract(8, "years").add("3", "months").toDate()
);
const child5 = Child.create("Sixth Child");
child5.dateOfBirth = new DateWithAge(
  moment().subtract(10, "years").add("100", "days").toDate()
);

export default {
  title: "Features/Dashboards/BirthdayDashboard",
  component: BirthdayDashboardComponent,
  decorators: [
    moduleMetadata({
      imports: [
        BirthdayDashboardComponent,
        StorybookBaseModule,
        MockedTestingModule.withState(LoginState.LOGGED_IN, [
          child2,
          child1,
          child4,
          child5,
          child3,
        ]),
      ],
    }),
  ],
} as Meta;

const Template: Story<BirthdayDashboardComponent> = (
  args: BirthdayDashboardComponent
) => ({
  component: BirthdayDashboardComponent,
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {};
