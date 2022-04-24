import { moduleMetadata } from "@storybook/angular";
import { Meta, Story } from "@storybook/angular/types-6-0";
import { EntityListComponent } from "./entity-list.component";
import { EntityListModule } from "./entity-list.module";
import { Child } from "../../../child-dev-project/children/model/child";
import { DemoChildGenerator } from "../../../child-dev-project/children/demo-data-generators/demo-child-generator.service";
import { User } from "../../user/user";
import { ConfigurableEnumModule } from "../../configurable-enum/configurable-enum.module";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { ChildrenModule } from "../../../child-dev-project/children/children.module";

const user = new User();
user.paginatorSettingsPageSize["ageprojectNumbernamegendercenterstatus"] = 13;

export default {
  title: "Core/EntityComponents/Entity List",
  component: EntityListComponent,
  decorators: [
    moduleMetadata({
      imports: [
        EntityListModule,
        StorybookBaseModule,
        MockedTestingModule.withState(),
        ConfigurableEnumModule,
        ChildrenModule,
      ],
    }),
  ],
} as Meta;

const Template: Story<EntityListComponent<Child>> = (
  args: EntityListComponent<Child>
) => ({
  component: EntityListComponent,
  props: args,
});

const children = new DemoChildGenerator({ count: 25 }).generateEntities();

export const Primary = Template.bind({});
Primary.args = {
  allEntities: children,
  entityConstructor: Child,
  listConfig: {
    title: "Children List",
    columns: [{ id: "age", label: "Age", view: "DisplayText" }],
    columnGroups: {
      mobile: "Mobile",
      default: "Normal",
      groups: [
        {
          name: "Normal",
          columns: [
            "projectNumber",
            "name",
            "age",
            "gender",
            "center",
            "status",
          ],
        },
        {
          name: "Mobile",
          columns: ["projectNumber", "name", "age"],
        },
      ],
    },
    filters: [
      {
        id: "isActive",
        type: "boolean",
        default: "true",
        true: "Active Children",
        false: "Inactive",
        all: "All",
      },
      {
        id: "center",
        label: "Center",
        type: "configurable-enum",
        enumId: "center",
        display: "dropdown",
      },
    ],
  },
};
