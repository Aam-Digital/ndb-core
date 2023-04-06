import { moduleMetadata } from "@storybook/angular";
import { Meta, Story } from "@storybook/angular/types-6-0";
import { Child } from "../../../../child-dev-project/children/model/child";
import { EntityFormComponent } from "./entity-form.component";
import { School } from "../../../../child-dev-project/schools/model/school";
import { StorybookBaseModule } from "../../../../utils/storybook-base.module";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";
import { LoginState } from "../../../session/session-states/login-state.enum";

const s1 = new School();
s1.name = "First School";
const s2 = new School();
s2.name = "Second School";
const s3 = new School();
s3.name = "Third School";

export default {
  title: "Core/EntityComponents/EntityForm",
  component: EntityFormComponent,
  decorators: [
    moduleMetadata({
      imports: [
        EntityFormComponent,
        StorybookBaseModule,
        MockedTestingModule.withState(LoginState.LOGGED_IN, [s1, s2, s3]),
      ],
    }),
  ],
} as Meta;

const cols = [
  [
    {
      id: "photo",
    },
  ],
  [
    {
      id: "name",
      required: true,
    },
    {
      id: "projectNumber",
      edit: "EditNumber",
      tooltip: "some extra explanation",
    },
    {
      edit: "EditLongText",
      id: "status",
      label: "Additional information",
    },
    { id: "gender" },
  ],
  [
    {
      edit: "EditConfigurableEnum",
      view: "DisplayConfigurableEnum",
      id: "has_rationCard",
      label: "Ration Card Status",
      additional: "document-status",
    },
    {
      id: "admissionDate",
    },
    {
      id: "dateOfBirth",
    },
    {
      id: "assignedTo",
      dataType: "entity-array",
      additional: "School",
      label: "Assigned school(s)",
    },
  ],
  [{ id: "school" }, { id: "configurable-enum-array" }],
];

Child.schema.set("has_rationCard", {
  dataType: "configurable-enum",
  innerDataType: "document-status",
});
Child.schema.set("assignedTo", { dataType: "array", innerDataType: "string" });
Child.schema.set("school", {
  dataType: "entity",
  label: "Assigned School",
  additional: School.ENTITY_TYPE,
  validators: {
    required: true,
  },
});
Child.schema.set("configurable-enum-array", {
  dataType: "array",
  innerDataType: "configurable-enum",
  additional: "document-status",
  label: "Enum Multi Select",
});

const Template: Story<EntityFormComponent> = (args: EntityFormComponent) => ({
  component: EntityFormComponent,
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {
  entity: new Child(),
  // Both need to be set otherwise story breaks
  columns: cols,
  _columns: cols,
  creatingNew: true,
};
