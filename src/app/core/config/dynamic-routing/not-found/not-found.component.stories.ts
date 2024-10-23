import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { StorybookBaseModule } from "../../../../utils/storybook-base.module";
import { NotFoundComponent } from "./not-found.component";
import { importProvidersFrom } from "@angular/core";

export default {
  title: "Core/> App Layout/Error Page Not Found",
  component: NotFoundComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(StorybookBaseModule)],
    }),
  ],
} as Meta;

const Template: StoryFn<NotFoundComponent> = (args: NotFoundComponent) => ({
  component: NotFoundComponent,
  props: args,
});

export const Primary = {
  render: Template,
};
