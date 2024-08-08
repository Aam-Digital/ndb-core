import { Meta, moduleMetadata, StoryFn } from "@storybook/angular";
import { DraggableGridSampleComponent } from "./draggable-grid.sample-component";

export default {
  title: "DraggableGrid",
  component: DraggableGridSampleComponent,
  decorators: [
    moduleMetadata({
      imports: [DraggableGridSampleComponent],
    }),
  ],
} as Meta;

const Template: StoryFn<DraggableGridSampleComponent> = (args) => ({
  component: DraggableGridSampleComponent,
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {
  items: [
    "Item -- 1",
    "Item -- 2",
    "Item -- 3",
    "Item -- 4",
    "Item -- 5",
    "Item -- 6",
    "Item -- 7",
    "Item -- 8",
    "Item -- 9",
    "Item -- 10",
  ],
};
