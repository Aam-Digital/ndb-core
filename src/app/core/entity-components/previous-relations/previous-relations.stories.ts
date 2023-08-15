import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { PreviousRelationsComponent } from "./previous-relations.component";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { importProvidersFrom } from "@angular/core";
import { ChildSchoolRelation } from "../../../child-dev-project/children/model/childSchoolRelation";
import { Child } from "../../../child-dev-project/children/model/child";
import { School } from "../../../child-dev-project/schools/model/school";

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
  component: PreviousRelationsComponent,
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(
          StorybookBaseModule.withData([school1, school2, rel1, rel2, rel3]),
        ),
      ],
    }),
  ],
} as Meta;

const Template: StoryFn<PreviousRelationsComponent> = (
  args: PreviousRelationsComponent,
) => ({
  component: PreviousRelationsComponent,
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {
  entity: child,
};
