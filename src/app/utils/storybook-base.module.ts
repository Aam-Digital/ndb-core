import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FaIconLibrary,
  FontAwesomeModule,
} from "@fortawesome/angular-fontawesome";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { far } from "@fortawesome/free-regular-svg-icons";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { Angulartics2Module } from "angulartics2";
import { RouterTestingModule } from "@angular/router/testing";
import { entityRegistry } from "../core/entity/database-entity.decorator";
import { ConfigService } from "../core/config/config.service";
import { AbilityService } from "../core/permissions/ability/ability.service";
import { BehaviorSubject, Subject } from "rxjs";
import { EntityAbility } from "../core/permissions/ability/entity-ability";
import { defineAbility } from "@casl/ability";
import { SessionService } from "../core/session/session-service/session.service";
import { SyncState } from "../core/session/session-states/sync-state.enum";
import { createTestingConfigService } from "../core/config/testing-config-service";
import { componentRegistry } from "../dynamic-components";
import { AppModule } from "../app.module";
import { LoginState } from "../core/session/session-states/login-state.enum";
import { AuthUser } from "../core/session/session-service/auth-user";
import { environment } from "../../environments/environment";

componentRegistry.allowDuplicates();
entityRegistry.allowDuplicates();
environment.demo_mode = false;

export const entityFormStorybookDefaultParameters = {
  controls: {
    exclude: ["_columns", "_cols", "enumValueToString"],
  },
};

export const mockAbilityService = {
  abilityUpdated: new Subject<void>(),
  initializeRules: () => {},
};

export function mockSessionService(currentUser?: AuthUser): SessionService {
  if (!currentUser) {
    currentUser = { name: "demo-user", roles: [] };
  }
  return {
    getCurrentUser: () => currentUser,
    syncState: new BehaviorSubject(SyncState.COMPLETED),
    isLoggedIn: () => true,
    loginState: new BehaviorSubject(LoginState.LOGGED_IN),
  } as SessionService;
}

/**
 * Utility module to be imported in Storybook stories to ensure central setup like fontawesome icons are available.
 */
@NgModule({
  declarations: [],
  imports: [
    AppModule,
    CommonModule,
    BrowserAnimationsModule,
    FontAwesomeModule,
    Angulartics2Module.forRoot(),
    RouterTestingModule,
  ],
  providers: [
    { provide: ConfigService, useValue: createTestingConfigService() },
    { provide: AbilityService, useValue: mockAbilityService },
    {
      provide: EntityAbility,
      useValue: defineAbility((can) => can("manage", "all")),
    },
    {
      provide: SessionService,
      useValue: mockSessionService(),
    },
  ],
})
export class StorybookBaseModule {
  constructor(icons: FaIconLibrary) {
    icons.addIconPacks(fas, far);
  }
}
