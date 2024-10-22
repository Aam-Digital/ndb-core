import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { importProvidersFrom } from "@angular/core";
import { ListFilterComponent } from "./list-filter.component";
import { Entity } from "../../entity/model/entity";
import { FilterConfig } from "../../entity-list/EntityListConfig";

export default {
  title: "Core/> App Layout/Filter",
  component: ListFilterComponent<Entity>,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(StorybookBaseModule)],
    }),
  ],
} as Meta;

const Template: StoryFn<ListFilterComponent<Entity>> = (
  args: ListFilterComponent<Entity>,
) => ({
  component: ListFilterComponent<Entity>,
  props: args,
});

const filterConfig: FilterConfig = {
  id: "isActive",
  label: "Active",
  options: [
    { key: "true", label: "Yes", filter: { isActive: true } },
    { key: "false", label: "No", filter: { isActive: false } },
  ],
};

export const Default = {
  render: Template,

  args: {
    filterConfig,
  },
};
