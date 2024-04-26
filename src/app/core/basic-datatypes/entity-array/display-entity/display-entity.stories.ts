import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { Child } from "../../../../child-dev-project/children/model/child";
import { DisplayEntityComponent } from "./display-entity.component";
import { StorybookBaseModule } from "../../../../utils/storybook-base.module";
import { importProvidersFrom } from "@angular/core";

const child1 = new Child();
child1.name = "Test Name";
child1.projectNumber = "1";
const child2 = new Child();
child2.name = "First Name";
child2.projectNumber = "2";
const child3 = new Child();
child3.name = "Second Name";
child3.projectNumber = "3";
const child4 = new Child();
child4.name = "Third Name";
child4.projectNumber = "4";
const child5 = new Child();
child5.name = "Fifth Name";
child5.projectNumber = "5";

export default {
  title: "Core/Entities/Properties/entity/DisplayEntity",
  component: DisplayEntityComponent,
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(
          StorybookBaseModule.withData([
            child1,
            child2,
            child3,
            child4,
            child5,
          ]),
        ),
      ],
    }),
  ],
} as Meta;

const Template: StoryFn<DisplayEntityComponent> = (
  args: DisplayEntityComponent,
) => ({
  component: DisplayEntityComponent,
  props: args,
});

export const FewEntities = Template.bind({});
FewEntities.args = {
  value: [child1, child2].map((x) => x.getId()),
};

export const ManyEntities = Template.bind({});
ManyEntities.args = {
  value: [child1, child2, child3, child4, child5].map((x) => x.getId()),
};
