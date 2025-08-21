import { applicationConfig, Meta } from "@storybook/angular";
import { FormControl } from "@angular/forms";
import { EditEmailComponent } from "./edit-email.component";
import { importProvidersFrom } from "@angular/core";
import { StorybookBaseModule } from "app/utils/storybook-base.module";

export default {
  title: "Core/Entities/Properties/email/EditEmail",
  component: EditEmailComponent,
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
      formControl: new FormControl("test@example.com"),
    },
  }),
  args: {
    label: "Email",
  },
};

export const Disabled = {
  render: (args) => ({
    props: {
      ...args,
      formControl: new FormControl({
        value: "disabled@example.com",
        disabled: true,
      }),
    },
  }),
  args: {
    label: "Email",
  },
};

export const InvalidEmail = {
  render: (args) => ({
    props: {
      ...args,
      formControl: new FormControl("not-an-email"),
    },
  }),
  args: {
    label: "Email",
  },
};
