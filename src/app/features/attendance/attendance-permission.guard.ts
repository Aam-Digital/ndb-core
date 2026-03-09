import { inject, Injectable } from "@angular/core";
import { ActivatedRouteSnapshot } from "@angular/router";
import { AbstractPermissionGuard } from "#src/app/core/permissions/permission-guard/abstract-permission.guard";
import { DynamicComponentConfig } from "#src/app/core/config/dynamic-components/dynamic-component-config.interface";
import { AttendanceService } from "./attendance.service";
import { AttendanceFeatureSettings } from "./model/attendance-feature-config";
import { EntityConstructor } from "#src/app/core/entity/model/entity";
import { EntityActionPermission } from "#src/app/core/permissions/permission-types";

/** Maps component name to the featureSettings property and required operation for permission checks. */
const COMPONENT_PERMISSIONS: Record<
  string,
  {
    configKey: keyof AttendanceFeatureSettings;
    operation: EntityActionPermission;
  }
> = {
  AttendanceManager: {
    configKey: "recurringActivityTypes",
    operation: "read",
  },
  AddDayAttendance: { configKey: "eventTypes", operation: "create" },
  RollCall: { configKey: "eventTypes", operation: "create" },
};

/**
 * Guard that checks route permissions based on the entity types configured in `AttendanceService.featureSettings`.
 * The user is granted access if they can perform the required operation on at least one of the configured entity types.
 *
 * For the RollCall route, the entity type is extracted from the `:id` param prefix (e.g. `TestEntity:abc` → `TestEntity`).
 * If no type can be extracted (e.g. `/new`), falls back to checking the `eventTypes` featureSettings (same as AddDayAttendance).
 *
 * Register this guard via `{ provide: AbstractPermissionGuard, useExisting: AttendancePermissionGuard, multi: true }`
 * so it is also evaluated during menu filtering by `RoutePermissionsService`.
 */
@Injectable()
export class AttendancePermissionGuard extends AbstractPermissionGuard {
  private readonly attendanceService = inject(AttendanceService);

  override async canActivate(route: ActivatedRouteSnapshot): Promise<boolean> {
    // if RollCall is opened with an id param, extract the type from this
    const id = route.params["id"];
    const entityType =
      route.data?.["component"] === "RollCall" && id?.includes(":")
        ? id.split(":")[0]
        : undefined;

    if (!entityType) return super.canActivate(route);

    await this.ensureAbilityInitialized();
    if (this.ability.can("create", entityType)) return true;

    this.router.navigate(["/404"]);
    return false;
  }

  protected async canAccessRoute(
    routeData: DynamicComponentConfig,
  ): Promise<boolean> {
    const permissionConfig = COMPONENT_PERMISSIONS[routeData?.["component"]];
    if (!permissionConfig) return true;

    const entityTypes: EntityConstructor[] =
      (this.attendanceService.featureSettings[
        permissionConfig.configKey
      ] as EntityConstructor[]) ?? [];

    if (entityTypes.length === 0) return true;

    await this.ensureAbilityInitialized();
    return entityTypes.some((type) =>
      this.ability.can(permissionConfig.operation, type),
    );
  }
}
