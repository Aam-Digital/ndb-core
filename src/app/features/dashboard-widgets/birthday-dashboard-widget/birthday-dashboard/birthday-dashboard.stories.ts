import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { BirthdayDashboardComponent } from "./birthday-dashboard.component";
import { StorybookBaseModule } from "../../../../utils/storybook-base.module";
import moment from "moment";
import { importProvidersFrom } from "@angular/core";
import { DateWithAge } from "app/core/basic-datatypes/date-with-age/dateWithAge";
import { TestEntity } from "../../../../utils/test-utils/TestEntity";

const child1 = TestEntity.create("First Child");
child1.dateOfBirth = new DateWithAge(
  moment().subtract(10, "years").add("10", "days").toDate(),
);
const child2 = TestEntity.create("Second Child");
child2.dateOfBirth = new DateWithAge(
  moment().subtract(9, "years").add("1", "month").toDate(),
);
const child3 = TestEntity.create("Third Child");
child3.dateOfBirth = new DateWithAge(
  moment().subtract(11, "years").add("40", "days").toDate(),
);
const child4 = TestEntity.create("Fifth Child");
child4.dateOfBirth = new DateWithAge(
  moment().subtract(8, "years").add("3", "months").toDate(),
);
const child5 = TestEntity.create("Sixth Child");
child5.dateOfBirth = new DateWithAge(
  moment().subtract(10, "years").add("100", "days").toDate(),
);

export default {
  title: "Features/Dashboard Widgets/Birthday Dashboard",
  component: BirthdayDashboardComponent,
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(
          StorybookBaseModule.withData([
            child2,
            child1,
            child4,
            child5,
            child3,
          ]),
        ),
      ],
    }),
  ],
} as Meta;

const Template: StoryFn<BirthdayDashboardComponent> = (
  args: BirthdayDashboardComponent,
) => ({
  component: BirthdayDashboardComponent,
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {};
