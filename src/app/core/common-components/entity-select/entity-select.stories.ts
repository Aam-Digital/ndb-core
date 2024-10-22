import { applicationConfig, Meta } from "@storybook/angular";
import { EntitySelectComponent } from "./entity-select.component";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { importProvidersFrom } from "@angular/core";
import { FormControl } from "@angular/forms";
import { TestEntity } from "../../../utils/test-utils/TestEntity";

const child1 = new TestEntity();
child1.name = "First Child";
child1.other = "1";
const child2 = new TestEntity();
child2.name = "Second Child";
child2.other = "2";
const child3 = new TestEntity();
child3.name = "Third Child";
child3.other = "3";
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

//componentRegistry.add("EntityBlock", async () => EntityBlockComponent);

const formDisabled = new FormControl();
formDisabled.setValue([child1.getId()]);
formDisabled.disable();


export const Active = {
  args: {
    entityType: "Child",
    label: "Attending Children",
    placeholder: "Select Children",
    form: new FormControl(),
  },
};

export const MultipleTypes = {
  args: {
    entityType: ["Child", TestEntity.ENTITY_TYPE],
    label: "Related Records",
    placeholder: "Select records",
    form: new FormControl(),
  },
};

export const SingleSelect = {
  args: {
    entityType: "Child",
    label: "Select one child",
    multi: false,
    form: new FormControl(child1.getId()),
  },
};

export const Disabled = {
  args: {
    entityType: "Child",
    label: "Attending Children",
    placeholder: "Select Children",
    form: formDisabled,
  },
};
