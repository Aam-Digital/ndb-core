import { Injectable } from "@angular/core";
import { Entity, EntityConstructor } from "../entity/model/entity";
import { SessionService } from "../session/session-service/session.service";
import { EntityConfigService } from "../entity/entity-config.service";

export enum OperationType {
  CREATE = "create",
  READ = "read",
  UPDATE = "update",
  DELETE = "delete",
}

@Injectable({
  providedIn: "root",
})
/**
 * This service manages the permissions of the currently logged in user for reading, updating, creating and deleting
 * entities.
 */
export class EntityPermissionsService {
  constructor(
    private entityConfigService: EntityConfigService,
    private sessionService: SessionService
  ) {}

  /**
   * This method checks if the current user is permitted to perform the given operation on the given entity
   * @param entity the constructor of the entity for which the permission is checked
   * @param operation the operation for which the permission is checked
   */
  public userIsPermitted(
    entity: EntityConstructor<Entity>,
    operation: OperationType
  ): boolean {
    const currentUser = this.sessionService.getCurrentDBUser();
    const entityConfig = this.entityConfigService.getEntityConfig(entity);
    if (entityConfig?.permissions && entityConfig.permissions[operation]) {
      // Check the user has a role that has permission for this operation
      return entityConfig.permissions[operation].some((role) =>
        currentUser.roles.includes(role)
      );
    }
    return true;
  }
}
