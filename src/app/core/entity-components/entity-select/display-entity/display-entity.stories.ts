import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { DisplayEntityComponent } from "./display-entity.component";
import { Child } from "../../../../child-dev-project/children/model/child";
import { School } from "../../../../child-dev-project/schools/model/school";
import { User } from "../../../user/user";
import { StorybookBaseModule } from "../../../../utils/storybook-base.module";
import { importProvidersFrom } from "@angular/core";

export default {
  title: "Core/Entities/Display Properties/DisplayEntity",
  component: DisplayEntityComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(StorybookBaseModule)],
    }),
  ],
} as Meta;

const Template: StoryFn<DisplayEntityComponent> = (
  args: DisplayEntityComponent,
) => ({
  component: DisplayEntityComponent,
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

const testUser = new User();
testUser.name = "Test User";
export const DefaultComponent = Template.bind({});
DefaultComponent.args = {
  entityToDisplay: testUser,
};
