import { ModuleWithProviders, NgModule } from "@angular/core";
import { LocalSession } from "./session-service/local-session";
import { SessionService } from "./session-service/session.service";
import { LoginState } from "./session-states/login-state.enum";
import { EntityMapperService } from "../entity/entity-mapper.service";
import {
  mockEntityMapper,
  MockEntityMapperService,
} from "../entity/mock-entity-mapper-service";
import { User } from "../user/user";
import { AnalyticsService } from "../analytics/analytics.service";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { Angulartics2Module } from "angulartics2";
import { RouterTestingModule } from "@angular/router/testing";
import { Database } from "../database/database";
import { AppConfig } from "../app-config/app-config";
import { SessionType } from "./session-type";
import { PouchDatabase } from "../database/pouch-database";
import { LOCATION_TOKEN } from "../../utils/di-tokens";
import {
  FaIconLibrary,
  FontAwesomeModule,
} from "@fortawesome/angular-fontawesome";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { far } from "@fortawesome/free-regular-svg-icons";
import { EntityAbility } from "../permissions/permission-types";
import { detectEntityType } from "../permissions/ability.service";
import { Entity } from "../entity/model/entity";
import { defineAbility, PureAbility } from "@casl/ability";

export const TEST_USER = "test";
export const TEST_PASSWORD = "pass";

/**
 * A simple module that can be imported in test files or stories to have mock implementations of the SessionService
 * and the EntityMapper. To use it put `imports: [MockSessionModule.withState()]` into the module definition of the
 * test or the story.
 * The static method automatically initializes the SessionService and the EntityMapper with a demo user using the
 * TEST_USER and TEST_PASSWORD constants. On default the user will also be logged in. This behavior can be changed
 * by passing a different state to the method e.g. `MockSessionModule.withState(LoginState.LOGGED_OUT)`.
 *
 * This module provides the services `SessionService` `EntityMapperService` and `MockEntityMapperService`.
 * The later two refer to the same service but injecting the `MockEntityMapperService` allows to access further methods.
 */
@NgModule({
  imports: [
    NoopAnimationsModule,
    Angulartics2Module.forRoot(),
    RouterTestingModule,
    FontAwesomeModule,
  ],
  providers: [
    {
      provide: AnalyticsService,
      useValue: { eventTrack: () => undefined },
    },
    {
      provide: LOCATION_TOKEN,
      useValue: window.location,
    },
  ],
})
export class MockSessionModule {
  static withState(
    loginState = LoginState.LOGGED_IN,
    data: Entity[] = []
  ): ModuleWithProviders<MockSessionModule> {
    AppConfig.settings = {
      site_name: "Aam Digital - DEV",
      session_type: SessionType.mock,
      database: {
        name: "test-db-name",
        remote_url: "https://demo.aam-digital.com/db/",
      },
    };
    const mockedEntityMapper = mockEntityMapper([new User(TEST_USER), ...data]);
    const session = createLocalSession(loginState === LoginState.LOGGED_IN);
    const ability = defineAbility<EntityAbility>(
      (can) => {
        can("manage", "all");
      },
      { detectSubjectType: detectEntityType }
    );
    return {
      ngModule: MockSessionModule,
      providers: [
        {
          provide: SessionService,
          useValue: session,
        },
        { provide: EntityMapperService, useValue: mockedEntityMapper },
        { provide: MockEntityMapperService, useValue: mockedEntityMapper },
        {
          provide: Database,
          useValue: session.getDatabase(),
        },
        {
          provide: EntityAbility,
          useValue: ability,
        },
        {
          provide: PureAbility,
          useExisting: EntityAbility,
        },
      ],
    };
  }
  constructor(iconLibrary: FaIconLibrary) {
    iconLibrary.addIconPacks(fas, far);
  }
}

function createLocalSession(andLogin?: boolean): SessionService {
  const localSession = new LocalSession(new PouchDatabase());
  localSession.saveUser(
    { name: TEST_USER, roles: ["user_app"] },
    TEST_PASSWORD
  );
  if (andLogin === true) {
    localSession.login(TEST_USER, TEST_PASSWORD);
  }
  return localSession;
}
