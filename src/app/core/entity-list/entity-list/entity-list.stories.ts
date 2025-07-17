import { applicationConfig, Meta } from "@storybook/angular";
import { EntityListComponent } from "./entity-list.component";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { importProvidersFrom } from "@angular/core";

export default {
  title: "Core/Entities/Entity List",
  component: EntityListComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(StorybookBaseModule)],
    }),
  ],
} as Meta;
