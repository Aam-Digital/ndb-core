import { StoryFn } from "@storybook/angular";
import { centersUnique } from "../../../../child-dev-project/children/demo-data-generators/fixtures/centers";
import { ConfigurableEnum } from "../configurable-enum";
import { generateFormFieldStory } from "../../../entity/default-datatype/edit-component-story-utils";

const centerEnum = Object.assign(new ConfigurableEnum("center"), {
  values: centersUnique,
});

const formFieldStory = generateFormFieldStory(
  "EditConfigurableEnum",
  centerEnum.values[1],
);

export default {
  title: "Core/Entities/Edit Properties/EditConfigurableEnum",
  ...formFieldStory.meta,
};
const Template: StoryFn = (args) => ({
  props: args,
});

export const Checked = Template.bind({});

export const Unchecked = Template.bind({});
const entity = new formFieldStory.entityType();
entity.main = centerEnum.values[2];
Unchecked.args = {
  entity: entity,
};

// export default {
//   title: "Core/Entities/Edit Properties/Enum Dropdown",
//   component: EnumDropdownComponent,
//   decorators: [
//     applicationConfig({
//       providers: [
//         importProvidersFrom(StorybookBaseModule),
//         importProvidersFrom(FormComponent),
//       ],
//     }),
//   ],
//   parameters: entityFormStorybookDefaultParameters,
// } as Meta;
//
// const Template: StoryFn<EnumDropdownComponent> = (
//   args: EnumDropdownComponent,
// ) => ({
//   props: args,
// });
//
// export const Primary = Template.bind({});
// Primary.args = {
//   form: new FormControl(""),
//   label: "test field",
//   enumId: "center",
// };

// const disabledControl = new FormControl(centersUnique[0]);
// disabledControl.disable();
// export const Disabled = Template.bind({});
// Disabled.args = {
//   form: disabledControl,
//   label: "test field",
//   enumId: "center",
// };
//
// export const Multi = Template.bind({});
// Multi.args = {
//   form: new FormControl([centersUnique[0], centersUnique[2]]),
//   label: "test field",
//   enumId: "center",
//   multi: true,
// };
