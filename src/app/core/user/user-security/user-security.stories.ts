import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { UserSecurityComponent } from "./user-security.component";
import { User } from "../user";
import { importProvidersFrom } from "@angular/core";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { KeycloakAuthService } from "app/core/session/auth/keycloak/keycloak-auth.service";
import { BehaviorSubject, of } from "rxjs";
import { HttpClient } from "@angular/common/http";
import {
  SessionInfo,
  SessionSubject,
} from "app/core/session/auth/session-info";

export default {
  title: "Core/Admin/User Security",
  component: UserSecurityComponent,
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(BrowserAnimationsModule),
        {
          provide: KeycloakAuthService,
          useValue: {
            getRoles: () => of(["account_manager", "user_app"]),
            getUser: () => {
              throw new Error("Not implemented");
            },
          },
        },
        { provide: HttpClient, useValue: {} },
        {
          provide: SessionSubject,
          useValue: new BehaviorSubject<SessionInfo>({
            roles: [KeycloakAuthService.ACCOUNT_MANAGER_ROLE],
            name: "tester",
            id: "tester",
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
