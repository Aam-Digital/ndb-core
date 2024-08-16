import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { EntityBlockComponent } from "./entity-block.component";
import { StorybookBaseModule } from "../../../../utils/storybook-base.module";
import { importProvidersFrom } from "@angular/core";
import { Entity } from "../../../entity/model/entity";
import { createEntityOfType } from "../../../demo-data/create-entity-of-type";

export default {
  title: "Core/Entities/EntityBlock",
  component: EntityBlockComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(StorybookBaseModule)],
    }),
  ],
} as Meta;

const Template: StoryFn<EntityBlockComponent> = (
  args: EntityBlockComponent,
) => ({
  component: EntityBlockComponent,
  props: args,
});

const testChild = createEntityOfType("Child");
testChild.name = "Test Name";
testChild.projectNumber = "10";
export const ChildComponent = Template.bind({});
ChildComponent.args = {
  entityToDisplay: testChild,
};

const testEntity = new Entity();
export const DefaultComponent = Template.bind({});
DefaultComponent.args = {
  entityToDisplay: testEntity,
};
