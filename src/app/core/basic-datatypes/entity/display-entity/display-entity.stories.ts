import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { DisplayEntityComponent } from "./display-entity.component";
import { StorybookBaseModule } from "../../../../utils/storybook-base.module";
import { importProvidersFrom } from "@angular/core";
import { TestEntity } from "../../../../utils/test-utils/TestEntity";

const child1 = new TestEntity();
child1.name = "Test Name";
child1.other = "1";
const child2 = new TestEntity();
child2.name = "First Name";
child2.other = "2";
const child3 = new TestEntity();
child3.name = "Second Name";
child3.other = "3";
const child4 = new TestEntity();
child4.name = "Third Name";
child4.other = "4";
const child5 = new TestEntity();
child5.name = "Fifth Name";
child5.other = "5";

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

export const FewEntities = {
  render: Template,

  args: {
    value: [child1, child2].map((x) => x.getId()),
  },
};

export const ManyEntities = {
  render: Template,

  args: {
    value: [child1, child2, child3, child4, child5].map((x) => x.getId()),
  },
};
