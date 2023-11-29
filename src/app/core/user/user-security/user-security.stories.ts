import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { UserSecurityComponent } from "./user-security.component";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { User } from "../user";
import { importProvidersFrom } from "@angular/core";

export default {
  title: "Core/Admin/User Security",
  component: UserSecurityComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(StorybookBaseModule)],
    }),
  ],
} as Meta;

const Template: StoryFn<UserSecurityComponent> = (
  args: UserSecurityComponent,
) => ({
  props: args,
});

export const NotRegistered = Template.bind({});
NotRegistered.args = {
  entity: new User(),
};
