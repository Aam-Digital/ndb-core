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
  ],
})
export class MockSessionModule {
  static withState(
    loginState = LoginState.LOGGED_IN
  ): ModuleWithProviders<MockSessionModule> {
    const mockedEntityMapper = mockEntityMapper([new User(TEST_USER)]);
    return {
      ngModule: MockSessionModule,
      providers: [
        {
          provide: SessionService,
          useValue: createLocalSession(loginState === LoginState.LOGGED_IN),
        },
        { provide: EntityMapperService, useValue: mockedEntityMapper },
        { provide: MockEntityMapperService, useValue: mockedEntityMapper },
        {
          provide: AnalyticsService,
          useValue: { eventTrack: () => null },
        },
      ],
    };
  }
}

function createLocalSession(andLogin?: boolean): SessionService {
  const localSession = new LocalSession(null);
  localSession.saveUser(
    { name: TEST_USER, roles: ["user_app"] },
    TEST_PASSWORD
  );
  if (andLogin === true) {
    localSession.login(TEST_USER, TEST_PASSWORD);
  }
  return localSession;
}
