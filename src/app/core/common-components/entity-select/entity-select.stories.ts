import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { Child } from "../../../child-dev-project/children/model/child";
import { EntitySelectComponent } from "./entity-select.component";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { componentRegistry } from "../../../dynamic-components";
import { ChildBlockComponent } from "../../../child-dev-project/children/child-block/child-block.component";
import { importProvidersFrom } from "@angular/core";
import { FormControl } from "@angular/forms";
import { TestEntity } from "../../../utils/test-utils/TestEntity";

const child1 = new Child();
child1.name = "First Child";
child1.projectNumber = "1";
const child2 = new Child();
child2.name = "Second Child";
child2.projectNumber = "2";
const child3 = new Child();
child3.name = "Third Child";
child3.projectNumber = "3";
child3.inactive = true;

export default {
  title: "Core/Entities/EntitySelect",
  component: EntitySelectComponent,
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(
          StorybookBaseModule.withData([
            child1,
            child2,
            child3,
            TestEntity.create({ name: "School ABC" }),
          ]),
        ),
      ],
    }),
  ],
  parameters: {
    controls: {
      exclude: [
        "allEntities",
        "filteredEntities",
        "selectedEntities",
        "formControl",
        "loading",
        "separatorKeysCodes",
        "additionalFilter",
        "accessor",
      ],
    },
  },
} as Meta;

componentRegistry.add("ChildBlock", async () => ChildBlockComponent);

const Template: StoryFn<EntitySelectComponent<Child>> = (
  args: EntitySelectComponent<Child>,
) => ({
  component: EntitySelectComponent,
  props: args,
});

export const Active = Template.bind({});
Active.args = {
  entityType: Child.ENTITY_TYPE,
  label: "Attending Children",
  placeholder: "Select Children",
  form: new FormControl(),
};

export const MultipleTypes = Template.bind({});
MultipleTypes.args = {
  entityType: [Child.ENTITY_TYPE, TestEntity.ENTITY_TYPE],
  label: "Related Records",
  placeholder: "Select records",
  form: new FormControl(),
};

export const SingleSelect = Template.bind({});
SingleSelect.args = {
  entityType: Child.ENTITY_TYPE,
  label: "Select one child",
  multi: false,
  form: new FormControl(child1.getId()),
};

export const Disabled = Template.bind({});
const formDisabled = new FormControl();
formDisabled.setValue([child1.getId()]);
formDisabled.disable();
Disabled.args = {
  entityType: Child.ENTITY_TYPE,
  label: "Attending Children",
  placeholder: "Select Children",
  form: formDisabled,
};
