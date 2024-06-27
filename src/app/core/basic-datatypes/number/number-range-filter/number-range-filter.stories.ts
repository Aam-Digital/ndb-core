import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { NumberRangeFilterComponent } from "./number-range-filter.component";
import { Entity } from "app/core/entity/model/entity";
import { NumberFilter } from "app/core/filter/filters/numberFilter";
import { provideAnimations } from "@angular/platform-browser/animations";

export default {
  title: "Core/> App Layout/Filter/Number Range Filter",
  component: NumberRangeFilterComponent<Entity>,
  decorators: [
    applicationConfig({
      providers: [provideAnimations()],
    }),
  ],
} as Meta;

const Template: StoryFn<NumberRangeFilterComponent<Entity>> = (
  args: NumberRangeFilterComponent<Entity>,
) => ({
  component: NumberRangeFilterComponent<Entity>,
  props: args,
});

const filterConfig: NumberFilter<Entity> = new NumberFilter<Entity>(
  "numberFilter",
);
filterConfig.label = "Demo Number Filter";

export const Default = Template.bind({});
Default.args = {
  filterConfig,
};
