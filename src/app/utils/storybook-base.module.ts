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
import { BehaviorSubject, NEVER, Subject } from "rxjs";
import { EntityAbility } from "../core/permissions/ability/entity-ability";
import { defineAbility } from "@casl/ability";
import { SessionService } from "../core/session/session-service/session.service";
import { SyncState } from "../core/session/session-states/sync-state.enum";
import { createTestingConfigService } from "../core/config/testing-config-service";
import { componentRegistry } from "../dynamic-components";
import { AppModule } from "../app.module";

componentRegistry.allowDuplicates();
entityRegistry.allowDuplicates();

export const entityFormStorybookDefaultParameters = {
  controls: {
    exclude: ["_columns"],
  },
};

export const mockAbilityService = {
  abilityUpdated: new Subject<void>(),
  initializeRules: () => {},
};

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
      useValue: {
        getCurrentUser: () => ({ name: "demo-user" }),
        syncState: new BehaviorSubject(SyncState.COMPLETED),
        isLoggedIn: () => true,
        loginState: NEVER,
      },
    },
  ],
})
export class StorybookBaseModule {
  constructor(icons: FaIconLibrary) {
    icons.addIconPacks(fas, far);
  }
}
