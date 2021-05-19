import { Story, Meta } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { RouterTestingModule } from "@angular/router/testing";
import { CommonModule, DatePipe } from "@angular/common";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { MatFormFieldModule } from "@angular/material/form-field";
import { PreviousSchoolsComponent } from "./previous-schools.component";
import { EntitySubrecordModule } from "../../core/entity-components/entity-subrecord/entity-subrecord.module";
import { EntityMapperService } from "../../core/entity/entity-mapper.service";
import { ChildSchoolRelation } from "../children/model/childSchoolRelation";
import { School } from "../schools/model/school";
import { ChildrenService } from "../children/children.service";
import { MatTooltipModule } from "@angular/material/tooltip";
import { SchoolsModule } from "../schools/schools.module";
import { Child } from "../children/model/child";

const school1 = new School();
school1.name = "School 1";
const school2 = new School();
school2.name = "School 2";
const rel1 = new ChildSchoolRelation();
rel1.schoolId = school1.getId();
rel1.schoolClass = "3";
rel1.start = new Date();
const rel2 = new ChildSchoolRelation();
rel2.schoolId = school2.getId();
rel2.schoolClass = "2";
rel2.start = new Date();
rel2.end = new Date();
const rel3 = new ChildSchoolRelation();
rel3.schoolId = school1.getId();
rel3.schoolClass = "1";
rel3.start = new Date();
rel3.end = new Date();

export default {
  title: "child-dev-project/Previous Schools",
  component: PreviousSchoolsComponent,
  decorators: [
    moduleMetadata({
      imports: [
        RouterTestingModule,
        EntitySubrecordModule,
        CommonModule,
        NoopAnimationsModule,
        MatFormFieldModule,
        MatTooltipModule,
        SchoolsModule,
      ],
      declarations: [],
      providers: [
        {
          provide: EntityMapperService,
          useValue: {
            loadType: () => Promise.resolve([school1, school2]),
            save: () => Promise.resolve(),
          },
        },
        DatePipe,
        {
          provide: ChildrenService,
          useValue: {
            getSchoolsWithRelations: () => Promise.resolve([rel1, rel2, rel3]),
          },
        },
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
  child: new Child(),
};
