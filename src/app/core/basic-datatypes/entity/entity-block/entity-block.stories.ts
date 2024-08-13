import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { EntityBlockComponent } from "./entity-block.component";
import { Child } from "../../../../child-dev-project/children/model/child";
import { School } from "../../../../child-dev-project/schools/model/school";
import { StorybookBaseModule } from "../../../../utils/storybook-base.module";
import { importProvidersFrom } from "@angular/core";
import { Entity } from "../../../entity/model/entity";

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

const testChild = new Child();
testChild.name = "Test Name";
testChild.projectNumber = "10";
export const ChildComponent = Template.bind({});
ChildComponent.args = {
  entityToDisplay: testChild,
};

const testSchool = new School();
testSchool.name = "Test School";
export const SchoolComponent = Template.bind({});
SchoolComponent.args = {
  entityToDisplay: testSchool,
};

const testEntity = new Entity();
export const DefaultComponent = Template.bind({});
DefaultComponent.args = {
  entityToDisplay: testEntity,
};
