import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { EntityListComponent } from "./entity-list.component";
import { Child } from "../../../child-dev-project/children/model/child";
import { DemoChildGenerator } from "../../../child-dev-project/children/demo-data-generators/demo-child-generator.service";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { importProvidersFrom } from "@angular/core";

export default {
  title: "Core/Entities/Entity List",
  component: EntityListComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(StorybookBaseModule)],
    }),
  ],
} as Meta;

const Template: StoryFn<EntityListComponent<Child>> = (
  args: EntityListComponent<Child>,
) => ({
  component: EntityListComponent,
  props: args,
});

const children = new DemoChildGenerator({ count: 25 }).generateEntities();

// TODO: fix or reimplement ListComponent stories
/*
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
*/
