import { applicationConfig, Meta } from "@storybook/angular";
import { FormControl } from "@angular/forms";
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
  render: (args) => ({
    props: {
      ...args,
      formControl: new FormControl(
        "https://github.com/Aam-Digital/ndb-core/issues/2460",
      ),
    },
  }),
  args: {
    label: "URL",
  },
};

export const DisabledWithClickableLink = {
  render: (args) => ({
    props: {
      ...args,
      formControl: new FormControl({
        value: "https://github.com/Aam-Digital/ndb-core/issues/2460",
        disabled: true,
      }),
    },
  }),
  args: {
    label: "URL",
  },
};

export const InvalidUrl = {
  render: (args) => ({
    props: {
      ...args,
      formControl: new FormControl("invalid-url"),
    },
  }),
  args: {
    label: "URL",
  },
};
