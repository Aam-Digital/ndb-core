import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FaIconLibrary,
  FontAwesomeModule,
} from "@fortawesome/angular-fontawesome";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { far } from "@fortawesome/free-regular-svg-icons";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { MatNativeDateModule } from "@angular/material/core";
import { Angulartics2Module } from "angulartics2";
import { RouterTestingModule } from "@angular/router/testing";
import {
  entityRegistry,
  EntityRegistry,
} from "../core/entity/database-entity.decorator";
import { ConfigService } from "../core/config/config.service";
import { AbilityService } from "../core/permissions/ability/ability.service";
import { BehaviorSubject, Subject } from "rxjs";
import { EntityAbility } from "../core/permissions/ability/entity-ability";
import { defineAbility } from "@casl/ability";
import { SessionService } from "../core/session/session-service/session.service";
import { SyncState } from "../core/session/session-states/sync-state.enum";
import { WINDOW_TOKEN } from "./di-tokens";
import { createTestingConfigService } from "../core/config/testing-config-service";
import { componentRegistry } from "../dynamic-components";
import { AppModule } from "../app.module";

export const entityFormStorybookDefaulParameters = {
  controls: {
    exclude: ["_columns"],
  },
};

export const mockAbilityService = {
  abilityUpdated: new Subject<void>(),
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
    MatNativeDateModule,
    Angulartics2Module.forRoot(),
    RouterTestingModule,
  ],
  providers: [
    { provide: EntityRegistry, useValue: entityRegistry },
    { provide: ConfigService, useValue: createTestingConfigService() },
    { provide: AbilityService, useValue: mockAbilityService },
    {
      provide: EntityAbility,
      useValue: defineAbility((can) => can("manage", "all")),
    },
    { provide: WINDOW_TOKEN, useValue: window },
    {
      provide: SessionService,
      useValue: {
        getCurrentUser: () => ({ name: "demo-user" }),
        syncState: new BehaviorSubject(SyncState.COMPLETED),
      },
    },
  ],
})
export class StorybookBaseModule {
  constructor(icons: FaIconLibrary) {
    icons.addIconPacks(fas, far);
    entityRegistry.allowDuplicates();
    componentRegistry.allowDuplicates();
  }
}
