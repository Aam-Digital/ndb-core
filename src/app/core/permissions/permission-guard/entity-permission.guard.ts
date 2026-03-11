import { Injectable } from "@angular/core";
import { CanActivate } from "@angular/router";
import { AbstractPermissionGuard } from "./abstract-permission.guard";
import { DynamicComponentConfig } from "../../config/dynamic-components/dynamic-component-config.interface";

/**
 * A guard that checks the current users permission to interact with the entity of the route.
 * Define `requiredPermissionOperation` in the route data / config, to enable a check that will find the relevant entity from config.
 */
@Injectable()
export class EntityPermissionGuard
  extends AbstractPermissionGuard
  implements CanActivate
{
  protected async canAccessRoute(
    routeData: DynamicComponentConfig,
  ): Promise<boolean> {
    const operation = routeData?.["requiredPermissionOperation"] ?? "read";
    const primaryEntity =
      routeData?.["entityType"] ??
      routeData?.["entity"] ??
      routeData?.["config"]?.["entityType"] ??
      routeData?.["config"]?.["entity"];

    if (!primaryEntity) {
      // No relevant config set => all users are allowed
      return true;
    }

    await this.ensureAbilityInitialized();
    return this.ability.can(operation, primaryEntity);
  }
}
