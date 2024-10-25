import { applicationConfig, Meta, StoryObj } from "@storybook/angular";
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

const filterConfig: NumberFilter<Entity> = new NumberFilter<Entity>(
  "numberFilter",
);
filterConfig.label = "Demo Number Filter";

export const Default: StoryObj<NumberRangeFilterComponent<Entity>> = {
  args: {
    filterConfig,
  },
};
