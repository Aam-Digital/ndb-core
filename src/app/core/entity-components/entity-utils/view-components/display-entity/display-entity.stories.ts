import { Story, Meta } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { DisplayEntityComponent } from "./display-entity.component";
import { Child } from "../../../../../child-dev-project/children/model/child";
import { BehaviorSubject } from "rxjs";
import { School } from "../../../../../child-dev-project/schools/model/school";
import { User } from "../../../../user/user";
import { SchoolsModule } from "../../../../../child-dev-project/schools/schools.module";
import { ChildrenModule } from "../../../../../child-dev-project/children/children.module";
import { StorybookBaseModule } from "../../../../../utils/storybook-base.module";
import { MockedTestingModule } from "../../../../../utils/mocked-testing.module";
import { EntityUtilsModule } from "../../entity-utils.module";

export default {
  title: "Core/EntityComponents/DisplayEntity",
  component: DisplayEntityComponent,
  decorators: [
    moduleMetadata({
      imports: [
        EntityUtilsModule,
        StorybookBaseModule,
        MockedTestingModule.withState(),
        SchoolsModule,
        ChildrenModule,
      ],
    }),
  ],
} as Meta;

const Template: Story<DisplayEntityComponent> = (
  args: DisplayEntityComponent
) => ({
  component: DisplayEntityComponent,
  props: args,
});

const testChild = new Child();
testChild.name = "Test Name";
testChild.projectNumber = "10";
testChild.photo = {
  path: "",
  photo: new BehaviorSubject("assets/child.png"),
};
export const ChildComponent = Template.bind({});
ChildComponent.args = {
  entity: testChild,
};
const testSchool = new School();
testSchool.name = "Test School";
export const SchoolComponent = Template.bind({});
SchoolComponent.args = {
  entity: testSchool,
};
const testUser = new User();
testUser.name = "Test User";
export const DefaultComponent = Template.bind({});
DefaultComponent.args = {
  entity: testUser,
};
