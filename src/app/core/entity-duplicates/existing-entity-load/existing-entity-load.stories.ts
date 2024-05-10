import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { importProvidersFrom } from "@angular/core";
import { Child } from "../../../child-dev-project/children/model/child";
import { School } from "../../../child-dev-project/schools/model/school";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import {
  DetailsComponentData,
  RowDetailsComponent,
} from "../../form-dialog/row-details/row-details.component";
import { genders } from "../../../child-dev-project/children/model/genders";

const child1 = Child.create("John Doe");
child1.gender = genders[1];
const child2 = Child.create("Jane X");
const child3 = Child.create("Max");
const school1 = School.create({ name: "School 1" });

export default {
  title: "Core/Entities/Load Existing into form",
  component: RowDetailsComponent,
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(
          StorybookBaseModule.withData([child1, child2, child3, school1]),
        ),
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            entity: new Child(),
            columns: [{ id: "name" }, { id: "gender" }],
          } as DetailsComponentData,
        },
      ],
    }),
  ],
} as Meta;

const Template: StoryFn<RowDetailsComponent> = (args: RowDetailsComponent) => ({
  component: RowDetailsComponent,
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {};
