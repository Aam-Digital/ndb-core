import { Meta, Story } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { ChildSchoolOverviewComponent } from "./child-school-overview.component";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { LoginState } from "../../../core/session/session-states/login-state.enum";
import { School } from "../model/school";
import { ChildSchoolRelation } from "../../children/model/childSchoolRelation";
import { Child } from "../../children/model/child";

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
  title: "Features/Previous Schools",
  component: ChildSchoolOverviewComponent,
  decorators: [
    moduleMetadata({
      imports: [
        ChildSchoolOverviewComponent,
        StorybookBaseModule,
        MockedTestingModule.withState(LoginState.LOGGED_IN, [
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

const Template: Story<ChildSchoolOverviewComponent> = (
  args: ChildSchoolOverviewComponent
) => ({
  component: ChildSchoolOverviewComponent,
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {
  child: child,
};
