import { ModuleWithProviders, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FaIconLibrary,
  FontAwesomeModule,
} from "@fortawesome/angular-fontawesome";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { far } from "@fortawesome/free-regular-svg-icons";
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
import { ConfigurableEnumService } from "../core/configurable-enum/configurable-enum.service";
import { createTestingConfigurableEnumService } from "../core/configurable-enum/configurable-enum-testing";
import { Entity } from "../core/entity/model/entity";
import { User } from "../core/user/user";
import { SessionType } from "../core/session/session-type";
import { mockEntityMapper } from "../core/entity/mock-entity-mapper-service";
import { EntityMapperService } from "../core/entity/entity-mapper.service";
import { Database } from "../core/database/database";
import { createLocalSession, TEST_USER } from "./mocked-testing.module";
import { DatabaseIndexingService } from "../core/entity/database-indexing/database-indexing.service";

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
    FontAwesomeModule,
    Angulartics2Module.forRoot(),
    RouterTestingModule,
  ],
  providers: [
    { provide: ConfigService, useValue: createTestingConfigService() },
    {
      provide: ConfigurableEnumService,
      useValue: createTestingConfigurableEnumService(),
    },
    { provide: AbilityService, useValue: mockAbilityService },
    {
      provide: EntityAbility,
      useValue: defineAbility((can) => can("manage", "all")),
    },
    {
      provide: SessionService,
      useValue: mockSessionService(),
    },
    {
      provide: DatabaseIndexingService,
      useValue: {
        createIndex: () => {},
        queryIndexDocsRange: () => Promise.resolve([]),
        queryIndexDocs: () => Promise.resolve([]),
      },
    },
  ],
})
export class StorybookBaseModule {
  static withData(
    data: Entity[] = [new User(TEST_USER)],
  ): ModuleWithProviders<StorybookBaseModule> {
    environment.session_type = SessionType.mock;
    const mockedEntityMapper = mockEntityMapper([...data]);
    const session = createLocalSession(true);
    return {
      ngModule: StorybookBaseModule,
      providers: [
        { provide: SessionService, useValue: session },
        { provide: EntityMapperService, useValue: mockedEntityMapper },
        { provide: ConfigService, useValue: createTestingConfigService() },
        {
          provide: ConfigurableEnumService,
          useValue: createTestingConfigurableEnumService(),
        },
        { provide: Database, useValue: session.getDatabase() },
      ],
    };
  }
  constructor(icons: FaIconLibrary) {
    icons.addIconPacks(fas, far);
  }
}
