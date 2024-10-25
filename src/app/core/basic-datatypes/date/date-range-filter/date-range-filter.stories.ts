import { applicationConfig, Meta, StoryObj } from "@storybook/angular";
import { Entity } from "app/core/entity/model/entity";
import { provideAnimations } from "@angular/platform-browser/animations";
import { DateRangeFilterComponent } from "./date-range-filter.component";
import { DateFilter } from "app/core/filter/filters/dateFilter";
import { provideNativeDateAdapter } from "@angular/material/core";

export default {
  title: "Core/> App Layout/Filter/Date Range Filter",
  component: DateRangeFilterComponent<Entity>,
  decorators: [
    applicationConfig({
      providers: [provideAnimations(), provideNativeDateAdapter()],
    }),
  ],
} as Meta;

const filterConfig: DateFilter<Entity> = new DateFilter<Entity>(
  "x",
  "Demo Date Filter",
  [],
);

export const Default: StoryObj<DateRangeFilterComponent<Entity>> = {
  args: {
    filterConfig,
  },
};
