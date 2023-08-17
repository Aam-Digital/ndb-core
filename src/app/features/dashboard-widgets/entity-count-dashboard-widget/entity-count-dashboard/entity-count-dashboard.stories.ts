import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { StorybookBaseModule } from "../../../../utils/storybook-base.module";
import { importProvidersFrom } from "@angular/core";
import { EntityCountDashboardComponent } from "./entity-count-dashboard.component";
import { Child } from "../../../../child-dev-project/children/model/child";
import { centersUnique } from "../../../../child-dev-project/children/demo-data-generators/fixtures/centers";

export default {
  title: "Features/Dashboard Widgets/Entity Count Dashboard",
  component: EntityCountDashboardComponent,
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(
          StorybookBaseModule.withData([
            Object.assign(new Child(), { center: centersUnique[0] }),
            Object.assign(new Child(), { center: centersUnique[1] }),
            Object.assign(new Child(), { center: centersUnique[1] }),
            Object.assign(new Child(), { center: centersUnique[1] }),
            Object.assign(new Child(), { center: centersUnique[2] }),
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
Primary.args = {};
