import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { EditUrlComponent } from "./edit-url.component";
import { importProvidersFrom } from "@angular/core";
import { StorybookBaseModule } from "app/utils/storybook-base.module";

export default {
  title: "Core/Entities/Properties/url/EditUrl",
  component: EditUrlComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(StorybookBaseModule)],
    }),
  ],
} as Meta;

export const Primary = {
  args: {
    label: "URL",
    formControl: new FormControl(
      "https://github.com/Aam-Digital/ndb-core/issues/2460",
    ),
  },
};

export const DisabledWithClickableLink = {
  args: {
    label: "URL",
    formControl: new FormControl({
      value: "https://github.com/Aam-Digital/ndb-core/issues/2460",
      disabled: true,
    }),
  },
};

export const InvalidUrl = {
  args: {
    label: "URL",
    formControl: new FormControl("invalid-url"),
  },
};
