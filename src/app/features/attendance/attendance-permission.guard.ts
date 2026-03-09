import { inject, Injectable } from "@angular/core";
import { ActivatedRouteSnapshot } from "@angular/router";
import { AbstractPermissionGuard } from "#src/app/core/permissions/permission-guard/abstract-permission.guard";
import { DynamicComponentConfig } from "#src/app/core/config/dynamic-components/dynamic-component-config.interface";
import { EntityAbility } from "#src/app/core/permissions/ability/entity-ability";
import { AttendanceService } from "./attendance.service";
import { AttendanceFeatureConfig } from "./model/attendance-feature-config";
import { EntityConstructor } from "#src/app/core/entity/model/entity";
import { EntityActionPermission } from "#src/app/core/permissions/permission-types";

/** Maps component name to the featureConfig property and required operation for permission checks. */
const COMPONENT_PERMISSIONS: Record<
  string,
  {
    configKey: keyof AttendanceFeatureConfig;
    operation: EntityActionPermission;
  }
> = {
  AttendanceManager: {
    configKey: "recurringActivityTypes",
    operation: "read",
  },
  AddDayAttendance: { configKey: "eventTypes", operation: "create" },
};

/**
 * Guard that checks route permissions based on the entity types configured in `AttendanceService.featureConfig`.
 * The user is granted access if they can perform the required operation on at least one of the configured entity types.
 *
 * For the RollCall route, the entity type is extracted from the `:id` param prefix (e.g. `EventNote:abc` → `EventNote`).
 *
 * Register this guard via `{ provide: AbstractPermissionGuard, useExisting: AttendancePermissionGuard, multi: true }`
 * so it is also evaluated during menu filtering by `RoutePermissionsService`.
 */
@Injectable()
export class AttendancePermissionGuard extends AbstractPermissionGuard {
  private ability = inject(EntityAbility);
  private attendanceService = inject(AttendanceService);

  override async canActivate(route: ActivatedRouteSnapshot): Promise<boolean> {
    if (route.data?.["component"] === "RollCall") {
      const entityType = route.params["id"]?.split(":")[0];
      if (entityType) {
        if (this.ability.rules.length === 0) {
          await new Promise((res) => this.ability.on("updated", res));
        }
        if (this.ability.can("create", entityType)) {
          return true;
        }
        this.router.navigate(["/404"]);
        return false;
      }
    }
    return super.canActivate(route);
  }

  protected async canAccessRoute(
    routeData: DynamicComponentConfig,
  ): Promise<boolean> {
    const permissionConfig = COMPONENT_PERMISSIONS[routeData?.["component"]];
    if (!permissionConfig) return true;

    const entityTypes: EntityConstructor[] =
      (this.attendanceService.featureConfig[
        permissionConfig.configKey
      ] as EntityConstructor[]) ?? [];

    if (entityTypes.length === 0) return true;

    if (this.ability.rules.length === 0) {
      await new Promise((res) => this.ability.on("updated", res));
    }

    return entityTypes.some((type) =>
      this.ability.can(permissionConfig.operation, type),
    );
  }
}
