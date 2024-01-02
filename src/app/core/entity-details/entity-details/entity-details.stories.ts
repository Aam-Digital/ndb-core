import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { importProvidersFrom } from "@angular/core";
import { EntityDetailsComponent } from "./entity-details.component";
import { Child } from "../../../child-dev-project/children/model/child";
import { EntityDetailsConfig } from "../EntityDetailsConfig";

const demoEntity = Child.create("John Doe");
demoEntity._rev = "1"; // make not "isNew"

const config: EntityDetailsConfig = {
  entity: "Child",
  panels: [
    {
      title: $localize`:Panel title:Basic Information`,
      components: [
        {
          title: "",
          component: "Form",
          config: {
            cols: [
              ["photo"],
              ["name", "projectNumber", "admissionDate"],
              ["center", "phone"],
            ],
            headers: [null, "Personal Information", "Contact Details"],
          },
        },
      ],
    },
    { title: "Other Details", components: [] },
  ],
};

export default {
  title: "Core/> App Layout/Entity Details",
  component: EntityDetailsComponent,
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(StorybookBaseModule.withData([demoEntity])),
      ],
    }),
  ],
} as Meta;

const Template: StoryFn<EntityDetailsComponent> = (
  args: EntityDetailsComponent,
) => ({
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {
  id: demoEntity.getId(true),
  ...config,
};
