import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { importProvidersFrom } from "@angular/core";
import { Child } from "../../../child-dev-project/children/model/child";
import { RelatedEntitiesComponent } from "./related-entities.component";
import { Note } from "../../../child-dev-project/notes/model/note";

const child = new Child("testChild");
child.name = "Testee";

export default {
  title: "Core/Entities/Related Entities",
  component: RelatedEntitiesComponent<Note>,
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(
          StorybookBaseModule.withData([
            child,
            Note.create(new Date("2023-01-23"), "note A", [child.getId()]),
            Note.create(new Date("2023-03-02"), "note B", [child.getId()]),
            Note.create(new Date("2023-06-18"), "note C", [child.getId()]),
          ]),
        ),
      ],
    }),
  ],
} as Meta;

const Template: StoryFn<RelatedEntitiesComponent<Note>> = (
  args: RelatedEntitiesComponent<Note>,
) => ({
  component: RelatedEntitiesComponent<Note>,
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {
  entity: child,
  entityType: Note.ENTITY_TYPE,
  property: "children",
  columns: ["date", "subject", "children"],
};
