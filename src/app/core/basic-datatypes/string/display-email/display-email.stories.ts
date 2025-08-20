import { applicationConfig, Meta } from "@storybook/angular";
import { DisplayEmailComponent } from "./display-email.component";
import { importProvidersFrom } from "@angular/core";
import { StorybookBaseModule } from "app/utils/storybook-base.module";

export default {
  title: "Core/Entities/Properties/email/DisplayEmail",
  component: DisplayEmailComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(StorybookBaseModule)],
    }),
  ],
} as Meta;

export const Primary = {
  args: {
    value: "test@example.com",
  },
};

export const Empty = {
  args: {
    value: "",
  },
};

export const Invalid = {
  args: {
    value: "not-an-email",
  },
};
