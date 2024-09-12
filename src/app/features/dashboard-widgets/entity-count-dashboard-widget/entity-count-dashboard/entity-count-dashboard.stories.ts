import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { StorybookBaseModule } from "../../../../utils/storybook-base.module";
import { importProvidersFrom } from "@angular/core";
import { EntityCountDashboardComponent } from "./entity-count-dashboard.component";
import { TestEntity } from "../../../../utils/test-utils/TestEntity";
import { genders } from "../../../../child-dev-project/children/model/genders";

export default {
  title: "Features/Dashboard Widgets/Entity Count Dashboard",
  component: EntityCountDashboardComponent,
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(
          StorybookBaseModule.withData([
            TestEntity.create({ category: genders[0] }),
            TestEntity.create({ category: genders[1] }),
            TestEntity.create({ category: genders[1] }),
            TestEntity.create({ category: genders[1] }),
            TestEntity.create({ category: genders[2] }),
          ]),
        ),
      ],
    }),
  ],
} as Meta;

const Template: StoryFn<EntityCountDashboardComponent> = (
  args: EntityCountDashboardComponent,
) => ({
  component: EntityCountDashboardComponent,
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {
  entityType: "TestEntity",
  groupBy: ["category", "gender"],
};
