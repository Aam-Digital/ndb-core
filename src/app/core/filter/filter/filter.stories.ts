import { moduleMetadata } from "@storybook/angular";
import { Meta, Story } from "@storybook/angular/types-6-0";
import { FilterComponent } from "./filter.component";
import { FilterModule } from "../filter.module";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

export default {
  title: "Core/Filter",
  component: FilterComponent,
  decorators: [
    moduleMetadata({
      imports: [FilterModule, BrowserAnimationsModule],
      providers: [],
    }),
  ],
} as Meta;

const Template: Story<FilterComponent<any>> = (args: FilterComponent<any>) => ({
  component: FilterComponent,
  props: args,
});

const testData = [{ x: "A" }, { x: "B" }, { y: 123 }, { x: "Z" }];

const defaultArgs = {
  label: "my filter",
  filterProperty: "x",
  data: testData,
};

export const Dropdown = Template.bind({});
Dropdown.args = {
  displayAsToggle: false,

  label: "my filter",
  filterProperty: "x",
  data: testData,
};

export const Toggle = Template.bind(defaultArgs);
Toggle.args = {
  displayAsToggle: true,

  label: "my filter",
  filterProperty: "x",
  data: testData,
};
