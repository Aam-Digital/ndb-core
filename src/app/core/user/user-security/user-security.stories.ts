import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { UserSecurityComponent } from "./user-security.component";
import {
  mockSessionService,
  StorybookBaseModule,
} from "../../../utils/storybook-base.module";
import { SessionService } from "../../session/session-service/session.service";
import { User } from "../user";
import { importProvidersFrom } from "@angular/core";

export default {
  title: "Core/Admin/User Security",
  component: UserSecurityComponent,
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(StorybookBaseModule),
        {
          provide: SessionService,
          useValue: mockSessionService({
            name: "Test",
            roles: ["account_manager"],
          }),
        },
      ],
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
