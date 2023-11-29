import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { importProvidersFrom } from "@angular/core";
import { LoginComponent } from "./login.component";
import { of } from "rxjs";

export default {
  title: "Core/> App Layout/Login",
  component: LoginComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(StorybookBaseModule)],
    }),
  ],
} as Meta;

const Template: StoryFn<LoginComponent> = (args: LoginComponent) => ({
  props: {
    ...args,
    siteSettingsService: { siteName: of("Aam Digital - Storybook") },
  },
});

export const LoginCheck = Template.bind({});
LoginCheck.args = {
  loginInProgress: true,
  offlineUsers: [{ name: "John" }, { name: "Jane" }],
};

export const LoginCheckWithoutLocalUsers = Template.bind({});
LoginCheckWithoutLocalUsers.args = {
  loginInProgress: true,
  offlineUsers: [],
};

export const Offline = Template.bind({});
Offline.args = {
  offlineUsers: [{ name: "John" }, { name: "Jane" }],
};
