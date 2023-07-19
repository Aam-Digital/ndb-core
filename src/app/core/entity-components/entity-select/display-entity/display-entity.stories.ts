import { Meta, Story } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { DisplayEntityComponent } from "./display-entity.component";
import { Child } from "../../../../child-dev-project/children/model/child";
import { School } from "../../../../child-dev-project/schools/model/school";
import { User } from "../../../user/user";
import { StorybookBaseModule } from "../../../../utils/storybook-base.module";
import { EntityMapperService } from "../../../entity/entity-mapper.service";
import { mockEntityMapper } from "../../../entity/mock-entity-mapper-service";
import { ChildrenService } from "../../../../child-dev-project/children/children.service";

export default {
  title: "Core/Entities/Display Properties/DisplayEntity",
  component: DisplayEntityComponent,
  decorators: [
    moduleMetadata({
      imports: [StorybookBaseModule, DisplayEntityComponent],
      providers: [
        { provide: EntityMapperService, useValue: mockEntityMapper([]) },
        { provide: ChildrenService, useValue: null },
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
