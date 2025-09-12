import { inject, NgModule } from "@angular/core";
import { FaIconLibrary } from "@fortawesome/angular-fontawesome";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { far } from "@fortawesome/free-regular-svg-icons";
import {
  EntityRegistry,
  entityRegistry,
} from "../core/entity/database-entity.decorator";
import { ConfigService } from "../core/config/config.service";
import { AbilityService } from "../core/permissions/ability/ability.service";
import { BehaviorSubject, EMPTY, of, Subject } from "rxjs";
import { EntityAbility } from "../core/permissions/ability/entity-ability";
import { defineAbility, PureAbility } from "@casl/ability";
import { ComponentRegistry, componentRegistry } from "../dynamic-components";
import { Entity } from "../core/entity/model/entity";
import {
  mockEntityMapperProvider,
  MockEntityMapperService,
} from "../core/entity/entity-mapper/mock-entity-mapper-service";
import { EntityMapperService } from "../core/entity/entity-mapper/entity-mapper.service";
import { DatabaseIndexingService } from "../core/entity/database-indexing/database-indexing.service";
import { EntityConfigService } from "../core/entity/entity-config.service";
import { TEST_USER } from "../core/user/demo-user-generator.service";
import { RouterTestingModule } from "@angular/router/testing";
import { LOCATION_TOKEN, NAVIGATOR_TOKEN, WINDOW_TOKEN } from "./di-tokens";
import { ConfirmationDialogService } from "../core/common-components/confirmation-dialog/confirmation-dialog.service";
import {
  LoginStateSubject,
  SyncStateSubject,
} from "../core/session/session-type";
import { LoginState } from "../core/session/session-states/login-state.enum";
import { SessionManagerService } from "../core/session/session-service/session-manager.service";
import { SetupService } from "../core/setup/setup.service";
import { SessionSubject } from "../core/session/auth/session-info";
import { UserAdminService } from "../core/user/user-admin-service/user-admin.service";
import { KeycloakAuthService } from "../core/session/auth/keycloak/keycloak-auth.service";
import { KeycloakService } from "keycloak-angular";
import {
  Angulartics2,
  Angulartics2Matomo,
  RouterlessTracking,
} from "angulartics2";
import { AnalyticsService } from "../core/analytics/analytics.service";
import { EntityActionsService } from "../core/entity/entity-actions/entity-actions.service";
import { FileService } from "../features/file/file.service";
import { HttpClient } from "@angular/common/http";
import { DatabaseResolverService } from "../core/database/database-resolver.service";
import { DefaultDatatype } from "../core/entity/default-datatype/default.datatype";
import { DefaultValueStrategy } from "../core/default-values/default-value-strategy.interface";
import { StaticDefaultValueService } from "../core/default-values/x-static/static-default-value.service";
import { SwUpdate } from "@angular/service-worker";

componentRegistry.allowDuplicates();
entityRegistry.allowDuplicates();

export const entityFormStorybookDefaultParameters = {
  controls: {
    exclude: ["_columns", "_cols", "enumValueToString"],
  },
};

/**
 * Utility module to be imported in Storybook stories to ensure central setup like fontawesome icons are available.
 */
@NgModule({
  declarations: [],
  imports: [RouterTestingModule],
  providers: [
    // { provide: ConfigService, useValue: provideTestingConfigService() },
    {
      provide: AbilityService,
      useValue: {
        abilityUpdated: new Subject<void>(),
        initializeRules: () => {},
      },
    },
    {
      provide: EntityAbility,
      useValue: defineAbility((can) => can("manage", "all")),
    },
    {
      provide: DatabaseIndexingService,
      useValue: {
        createIndex: () => {},
        queryIndexDocsRange: () => Promise.resolve([]),
        queryIndexDocs: () => Promise.resolve([]),
        indicesRegistered: EMPTY,
      },
    },
    {
      provide: EntityRegistry,
      useValue: {
        ...entityRegistry,
      },
    },
    {
      provide: EntityConfigService,
      useValue: {
        setupEntitiesFromConfig: () => {},
        getFieldConfigs: () => ({}),
      },
    },
    {
      provide: WINDOW_TOKEN,
      useValue: window,
    },
    {
      provide: LOCATION_TOKEN,
      useValue: window.location,
    },
    {
      provide: NAVIGATOR_TOKEN,
      useValue: navigator,
    },
    {
      provide: ConfirmationDialogService,
      useValue: {
        getConfirmation: () => Promise.resolve(true),
        openDialog: () => Promise.resolve(true),
      },
    },
    {
      provide: LoginStateSubject,
      useValue: new BehaviorSubject(LoginState.LOGGED_OUT),
    },
    {
      provide: SetupService,
      useValue: { detectConfigReadyState: Promise.resolve(true) },
    },
    {
      provide: ConfigService,
      useValue: {
        getConfig: () => ({}),
        configUpdates: new BehaviorSubject({}),
        getConfigDocument: () => Promise.resolve({}),
        saveConfigDocument: () => Promise.resolve(),
        hasConfig: () => true,
      },
    },
    SyncStateSubject,
    {
      provide: SessionManagerService,
      useValue: {
        getCurrentUser: () => of(null),
        getLoginState: () => of({ loggedIn: false }),
        login: () => Promise.resolve(),
        logout: () => Promise.resolve(),
        initSession: () => Promise.resolve(),
        currentUser: of(null),
        loginState: of({ loggedIn: false }),
        remoteLogin: () => Promise.resolve(),
        remoteLoginAvailable: () => false,
        offlineLogin: () => Promise.resolve(),
        getOfflineUsers: () => [],
        clearRemoteSessionIfNecessary: () => {},
      },
    },
    {
      provide: RouterlessTracking,
      useValue: {
        setUsernameProperties: () => {},
        setUserPropertiesOnce: () => {},
        setUserProperties: () => {},
        setSuperPropertiesOnce: () => {},
        setSuperProperties: () => {},
        unsetSuperProperty: () => {},
        userTimings: () => {},
        eventTrack: () => {},
        exceptionTrack: () => {},
        pageTrack: () => {},
      },
    },
    {
      provide: Angulartics2,
      useValue: {
        setUsername: new Subject(),
        setUserProperties: new Subject(),
        setUserPropertiesOnce: new Subject(),
        setSuperProperties: new Subject(),
        setSuperPropertiesOnce: new Subject(),
        unsetSuperProperty: new Subject(),
        userTimings: new Subject(),
        eventTrack: new Subject(),
        exceptionTrack: new Subject(),
        pageTrack: new Subject(),
        startTracking: () => {},
        settings: { ga: { additionalAccountNames: [] } },
      },
    },
    {
      provide: Angulartics2Matomo,
      useValue: {
        setUsername: () => {},
        startTracking: () => {},
      },
    },
    {
      provide: UserAdminService,
      useValue: {
        getUserById: (id: string) => of({ id, name: "Test User" }),
        getAllUsers: () => of([]),
        createUser: (user: any) => of(user),
        updateUser: (user: any) => of(user),
        deleteUser: (id: string) => of(true),
      },
    },
    {
      provide: FileService,
      useValue: {
        uploadFile: () => of({} as any),
        getDownloadUrl: () => "",
        deleteFile: () => of(true),
        getFile: () => of({} as any),
        listFiles: () => of([]),
      },
    },
    {
      provide: DefaultValueStrategy,
      useClass: StaticDefaultValueService,
      multi: true,
    },
    { provide: SwUpdate, useValue: { isEnabled: true } },
    { provide: DefaultDatatype, useClass: DefaultDatatype, multi: true },
    { provide: HttpClient, useValue: {} as HttpClient },
    { provide: ComponentRegistry, useValue: { componentRegistry } },
    AnalyticsService,
    EntityActionsService,
    SessionSubject,
    PureAbility,
    KeycloakAuthService,
    KeycloakService,
    DatabaseResolverService,
    ...mockEntityMapperProvider(),
  ],
})
export class StorybookBaseModule {
  private static initData: Entity[] = [];

  static withData(data: Entity[] = [new Entity(TEST_USER)]) {
    StorybookBaseModule.initData = data;
    return StorybookBaseModule;
  }

  constructor() {
    const icons = inject(FaIconLibrary);
    const entityMapper = inject(EntityMapperService);
    const entityConfigService = inject(EntityConfigService);

    (entityMapper as MockEntityMapperService).addAll(
      StorybookBaseModule.initData,
    );
    icons.addIconPacks(fas, far);
    entityConfigService.setupEntitiesFromConfig();
  }
}
