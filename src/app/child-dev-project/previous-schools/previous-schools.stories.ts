import { Meta, Story } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { PreviousSchoolsComponent } from "./previous-schools.component";
import { ChildSchoolRelation } from "../children/model/childSchoolRelation";
import { School } from "../schools/model/school";
import { Child } from "../children/model/child";
import { ChildrenModule } from "../children/children.module";
import { StorybookBaseModule } from "../../utils/storybook-base.module";
import { MockSessionModule } from "../../core/session/mock-session.module";
import { LoginState } from "../../core/session/session-states/login-state.enum";

const child = new Child("testChild");
const school1 = new School("1");
school1.name = "School 1";
const school2 = new School("2");
school2.name = "School 2";
const rel1 = new ChildSchoolRelation("1");
rel1.childId = child.getId();
rel1.schoolId = school1.getId();
rel1.schoolClass = "3";
rel1.start = new Date();
const rel2 = new ChildSchoolRelation("2");
rel2.childId = child.getId();
rel2.schoolId = school2.getId();
rel2.schoolClass = "2";
rel2.start = new Date();
rel2.end = new Date();
rel2.result = 80;
const rel3 = new ChildSchoolRelation("3");
rel3.childId = child.getId();
rel3.schoolId = school1.getId();
rel3.schoolClass = "1";
rel3.start = new Date();
rel3.end = new Date();
rel3.result = 23;

export default {
  title: "child-dev-project/Previous Schools",
  component: PreviousSchoolsComponent,
  decorators: [
    moduleMetadata({
      imports: [
        ChildrenModule,
        StorybookBaseModule,
        MockSessionModule.withState(LoginState.LOGGED_IN, [
          school1,
          school2,
          rel1,
          rel2,
          rel3,
        ]),
      ],
    }),
  ],
} as Meta;

const Template: Story<PreviousSchoolsComponent> = (
  args: PreviousSchoolsComponent
) => ({
  component: PreviousSchoolsComponent,
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {
  child: child,
};
