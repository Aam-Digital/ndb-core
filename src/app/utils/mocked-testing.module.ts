import { ModuleWithProviders, NgModule } from "@angular/core";
import { LoginState } from "../core/session/session-states/login-state.enum";
import { EntityMapperService } from "../core/entity/entity-mapper/entity-mapper.service";
import { mockEntityMapper } from "../core/entity/entity-mapper/mock-entity-mapper-service";
import { User, UserSubject } from "../core/user/user";
import { AnalyticsService } from "../core/analytics/analytics.service";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { RouterTestingModule } from "@angular/router/testing";
import { SessionType } from "../core/session/session-type";
import { Entity } from "../core/entity/model/entity";
import { DatabaseIndexingService } from "../core/entity/database-indexing/database-indexing.service";
import { ConfigService } from "../core/config/config.service";
import { environment } from "../../environments/environment";
import { createTestingConfigService } from "../core/config/testing-config-service";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { ReactiveFormsModule } from "@angular/forms";
import { AppModule } from "../app.module";
import { ComponentRegistry } from "../dynamic-components";
import { ConfigurableEnumService } from "../core/basic-datatypes/configurable-enum/configurable-enum.service";
import { createTestingConfigurableEnumService } from "../core/basic-datatypes/configurable-enum/configurable-enum-testing";
import { SwRegistrationOptions } from "@angular/service-worker";
import { TEST_USER } from "./mock-local-session";
import { BehaviorSubject } from "rxjs";

/**
 * Utility module that can be imported in test files or stories to have mock implementations of the SessionService
 * and the EntityMapper. To use it put `imports: [MockedTestingModule.withState()]` into the module definition of the
 * test or the story.
 * The static method automatically initializes the SessionService and the EntityMapper with a demo user using the
 * TEST_USER and TEST_PASSWORD constants. On default the user will also be logged in. This behavior can be changed
 * by passing a different state to the method e.g. `MockedTestingModule.withState(LoginState.LOGGED_OUT)`.
 * The EntityMapper can be initialized with Entities that are passed as the second argument to the static function.
 *
 * This module provides the services `SessionService` `EntityMapperService` together with other often needed services.
 *
 * If you need a REAL database (e.g. for indices/views) then use the {@link DatabaseTestingModule} instead.
 */
@NgModule({
  imports: [
    AppModule,
    NoopAnimationsModule,
    RouterTestingModule,
    HttpClientTestingModule,
    ReactiveFormsModule,
  ],
  providers: [
    { provide: SwRegistrationOptions, useValue: { enabled: false } },
    {
      provide: AnalyticsService,
      useValue: {
        eventTrack: () => undefined,
        setUser: () => undefined,
        init: () => undefined,
      },
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
export class MockedTestingModule {
  static withState(
    loginState = LoginState.LOGGED_IN,
    data: Entity[] = [new User(TEST_USER)],
  ): ModuleWithProviders<MockedTestingModule> {
    environment.session_type = SessionType.mock;
    const mockedEntityMapper = mockEntityMapper([...data]);
    return {
      ngModule: MockedTestingModule,
      providers: [
        { provide: EntityMapperService, useValue: mockedEntityMapper },
        { provide: ConfigService, useValue: createTestingConfigService() },
        {
          provide: ConfigurableEnumService,
          useValue: createTestingConfigurableEnumService(),
        },
        {
          provide: UserSubject,
          useValue: new BehaviorSubject({
            name: TEST_USER,
            roles: ["user_app"],
          }),
        },
      ],
    };
  }

  constructor(components: ComponentRegistry) {
    components.allowDuplicates();
  }
}
