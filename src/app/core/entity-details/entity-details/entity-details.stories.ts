import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { importProvidersFrom } from "@angular/core";
import { EntityDetailsComponent } from "./entity-details.component";
import { EntityDetailsConfig } from "../EntityDetailsConfig";
import { TestEntity } from "../../../utils/test-utils/TestEntity";

const demoEntity = TestEntity.create("John Doe");
demoEntity._rev = "1"; // make not "isNew"

const config: EntityDetailsConfig = {
  entityType: TestEntity.ENTITY_TYPE,
  panels: [
    {
      title: $localize`:Panel title:Basic Information`,
      components: [
        {
          title: "",
          component: "Form",
          config: {
            fieldGroups: [
              {
                fields: ["name", "dateOfBirth"],
                header: "Personal Information",
              },
              { fields: ["category", "other"], header: "Contact Details" },
            ],
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

export const Primary = {
  render: Template,

  args: {
    id: demoEntity.getId(true),
    ...config,
  },
};
