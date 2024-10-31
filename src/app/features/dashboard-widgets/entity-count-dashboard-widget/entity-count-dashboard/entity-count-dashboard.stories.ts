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
            TestEntity.create({ category: genders[0], other: "otherA" }),
            TestEntity.create({ category: genders[1], other: "otherB" }),
            TestEntity.create({ category: genders[1], other: "otherC" }),
            TestEntity.create({ category: genders[1], other: "otherD" }),
            TestEntity.create({ category: genders[2], other: "otherE" }),
            TestEntity.create({ category: genders[2], other: "otherF" }),
            TestEntity.create({ category: genders[2], other: "otherG" }),
            TestEntity.create({ category: genders[2], other: "otherH" }),
            TestEntity.create({ category: genders[2], other: "otherI" }),
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

export const Primary = {
  args: {
    entityType: "TestEntity",
    groupBy: ["other"],
  },
};
