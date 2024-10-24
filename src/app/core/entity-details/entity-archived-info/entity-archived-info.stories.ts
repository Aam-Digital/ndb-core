import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { importProvidersFrom } from "@angular/core";
import { EntityArchivedInfoComponent } from "./entity-archived-info.component";
import { Entity } from "../../entity/model/entity";

export default {
  title: "Core/> App Layout/Entity Details/Entity Archived Info",
  component: EntityArchivedInfoComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(StorybookBaseModule)],
    }),
  ],
} as Meta;

const Template: StoryFn<EntityArchivedInfoComponent> = (
  args: EntityArchivedInfoComponent,
) => ({
  props: args,
});

export const Archived = {
  render: Template,

  args: {
    entity: Object.assign(new Entity(), { inactive: true }),
  },
};

export const Anonymized = {
  render: Template,

  args: {
    entity: Object.assign(new Entity(), { inactive: true, anonymized: true }),
  },
};
