import { inject, ModuleWithProviders, NgModule } from "@angular/core";
import { LoginState } from "../core/session/session-states/login-state.enum";
import { mockEntityMapperProvider } from "../core/entity/entity-mapper/mock-entity-mapper-service";
import { AnalyticsService } from "../core/analytics/analytics.service";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { RouterTestingModule } from "@angular/router/testing";
import { SessionType } from "../core/session/session-type";
import { Entity } from "../core/entity/model/entity";
import { DatabaseIndexingService } from "../core/entity/database-indexing/database-indexing.service";
import { ConfigService } from "../core/config/config.service";
import { environment } from "../../environments/environment";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { ReactiveFormsModule } from "@angular/forms";
import { AppModule } from "../app.module";
import { ComponentRegistry } from "../dynamic-components";
import { ConfigurableEnumService } from "../core/basic-datatypes/configurable-enum/configurable-enum.service";
import { SwRegistrationOptions } from "@angular/service-worker";
import { BehaviorSubject } from "rxjs";
import { CurrentUserSubject } from "../core/session/current-user-subject";
import { SessionInfo, SessionSubject } from "../core/session/auth/session-info";
import { TEST_USER } from "../core/user/demo-user-generator.service";
import { EntityAbility } from "../core/permissions/ability/entity-ability";
import { EntitySchemaService } from "../core/entity/schema/entity-schema.service";
import { entityAbilityFactory } from "app/core/permissions/ability/testing-entity-ability-factory";
import { createEntityOfType } from "../core/demo-data/create-entity-of-type";
import { TestEntity } from "./test-utils/TestEntity";
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from "@angular/common/http";
import { LoggingService } from "../core/logging/logging.service";
import { getDefaultConfigEntity } from "app/core/config/testing-config-service";
import { getDefaultEnumEntities } from "../core/basic-datatypes/configurable-enum/configurable-enum-testing";

/**
 * Utility module that can be imported in test files or stories to have mock implementations of the SessionService
 * and the EntityMapper. To use it put `imports: [MockedTestingModule.withState()]` into the module definition of the
 * test or the story.
 * The static method automatically initializes the SessionService and the EntityMapper with a demo user using the
 * TEST_USER and TEST_PASSWORD constants. On default the user will also be logged in. This behavior can be changed
 * by passing a different state to the method e.g. `MockedTestingModule.withState(LoginState.LOGGED_OUT)`.
 * The EntityMapper can be initialized with Entities that are passed as the second argument to the static function.
 *
 * This module provides the services `SessionService` `EntityMapperService` together with other often needed backup.
 *
 * If you need a REAL database (e.g. for indices/views) then use the {@link DatabaseTestingModule} instead.
 */
@NgModule({
  imports: [
    AppModule,
    NoopAnimationsModule,
    RouterTestingModule,
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
    provideHttpClient(withInterceptorsFromDi()),
    provideHttpClientTesting(),
  ],
})
export class MockedTestingModule {
  static withState(
    loginState = LoginState.LOGGED_IN,
    data: Entity[] = [createEntityOfType("User", TEST_USER)],
  ): ModuleWithProviders<MockedTestingModule> {
    environment.session_type = SessionType.mock;
    let mockLoggingService: jasmine.SpyObj<LoggingService>;
    mockLoggingService = jasmine.createSpyObj(["warn"]);

    return {
      ngModule: MockedTestingModule,
      providers: [
        {
          provide: EntityAbility,
          useFactory: entityAbilityFactory,
          deps: [EntitySchemaService],
        },

        { provide: LoggingService, useValue: mockLoggingService },
        mockEntityMapperProvider([
          ...data,
          getDefaultConfigEntity(),
          ...getDefaultEnumEntities(),
        ]),
        ConfigService,
        ConfigurableEnumService,
        {
          provide: SessionSubject,
          useValue: new BehaviorSubject<SessionInfo>({
            name: TEST_USER,
            id: TEST_USER,
            roles: ["user_app"],
          }),
        },
        {
          provide: CurrentUserSubject,
          useValue: new BehaviorSubject(new TestEntity(TEST_USER)),
        },
      ],
    };
  }

  constructor() {
    const components = inject(ComponentRegistry);

    components.allowDuplicates();
  }
}
