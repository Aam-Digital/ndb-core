import { NgModule, APP_INITIALIZER } from "@angular/core";
import { BehaviorSubject, EMPTY, of, Subject } from "rxjs";
import { RouterTestingModule } from "@angular/router/testing";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { ConfigService } from "../core/config/config.service";
import { MenuService } from "../core/ui/navigation/menu.service";
import { RoutePermissionsService } from "../core/config/dynamic-routing/route-permissions.service";
import { MenuItem } from "../core/ui/navigation/menu-item";
import { AbilityService } from "../core/permissions/ability/ability.service";
import { EntityAbility } from "../core/permissions/ability/entity-ability";
import { defineAbility } from "@casl/ability";
import { EntityMapperService } from "../core/entity/entity-mapper/entity-mapper.service";
import { DatabaseIndexingService } from "../core/entity/database-indexing/database-indexing.service";
import { EntityConfigService } from "../core/entity/entity-config.service";
import { ImportAdditionalService } from "../core/import/additional-actions/import-additional.service";
import { EntityRelationsService } from "../core/entity/entity-mapper/entity-relations.service";
import { UpdateManagerService } from "../core/ui/latest-changes/update-manager.service";
import { AlertService } from "../core/alerts/alert.service";
import { ConfirmationDialogService } from "../core/common-components/confirmation-dialog/confirmation-dialog.service";
import { EntityRegistry } from "../core/entity/database-entity.decorator";
import { SessionManagerService } from "../core/session/session-service/session-manager.service";
import { LoginStateSubject } from "../core/session/session-type";
import { LoginState } from "../core/session/session-states/login-state.enum";
import {
  WINDOW_TOKEN,
  LOCATION_TOKEN,
  NAVIGATOR_TOKEN,
} from "../utils/di-tokens";
import { SessionSubject } from "../core/session/auth/session-info";
import { RouterlessTracking } from "angulartics2";

function storybookAppInitializer() {
  return () => Promise.resolve();
}

/**
 * Minimal module required for Storybook that provides only essential mocked services
 */
@NgModule({
  imports: [RouterTestingModule, HttpClientTestingModule],
  providers: [
    {
      provide: ConfigService,
      useValue: {
        getConfig: () => ({}),
        configUpdates: new BehaviorSubject({}),
        getConfigDocument: () => Promise.resolve({}),
        saveConfigDocument: () => Promise.resolve(),
      },
    },
    {
      provide: MenuService,
      useValue: {
        menuItems: new BehaviorSubject<MenuItem[]>([
          { label: "Home", icon: "home", link: "/" },
          { label: "About", icon: "info", link: "/about" },
        ]),
      },
    },
    {
      provide: RoutePermissionsService,
      useValue: {
        filterPermittedRoutes: (items: MenuItem[]) => Promise.resolve(items),
        isAccessibleRouteForUser: () => Promise.resolve(true),
      },
    },
    {
      provide: AbilityService,
      useValue: {
        abilityUpdated: new Subject<void>(),
        initializeRules: () => {},
        ability: defineAbility((can) => can("manage", "all")),
      },
    },
    {
      provide: EntityAbility,
      useValue: defineAbility((can) => can("manage", "all")),
    },
    {
      provide: EntityRegistry,
      useValue: {
        entries: () => new Map(),
        get: () => undefined,
        has: () => false,
        allowDuplicates: () => {},
      },
    },
    {
      provide: EntityMapperService,
      useValue: {
        save: () => Promise.resolve(),
        load: () => Promise.resolve(undefined),
        loadType: () => Promise.resolve([]),
        remove: () => Promise.resolve(),
        addAll: () => {},
      },
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
      provide: EntityConfigService,
      useValue: {
        setupEntitiesFromConfig: () => {},
        getFieldConfigs: () => ({}),
      },
    },
    {
      provide: ImportAdditionalService,
      useValue: {
        executeImport: () => Promise.resolve(),
        undoImport: () => Promise.resolve(),
        createActionLabel: () => "Mock Action",
        updateLinkableEntities: () => {},
        getLinkableEntities: () => [],
        generateLinkActionsFor: () => [],
      },
    },
    {
      provide: EntityRelationsService,
      useValue: {
        getRelatedEntities: () => Promise.resolve([]),
        getIncomingRelations: () => [],
        updateRelatedEntities: () => Promise.resolve(),
      },
    },
    {
      provide: UpdateManagerService,
      useValue: {
        checkForUpdates: () => Promise.resolve(),
        updateAvailable: of(false),
        updateEvent: new Subject(),
      },
    },
    {
      provide: AlertService,
      useValue: {
        addAlert: () => {},
        addInfo: () => {},
        addWarning: () => {},
        addError: () => {},
        addDanger: () => {},
        addSuccess: () => {},
        alertsSubject: new BehaviorSubject([]),
      },
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
      provide: SessionSubject,
      useValue: new BehaviorSubject({ name: "Test User", id: "test-user" }),
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
      provide: APP_INITIALIZER,
      useFactory: storybookAppInitializer,
      multi: true,
    },
  ],
})
export class StorybookMinimalModule {}
