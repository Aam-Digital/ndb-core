import { Injectable } from "@angular/core";
import { Entity } from "../entity/model/entity";
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
export class EntityPermissionsService {
  constructor(
    private entityConfigService: EntityConfigService,
    private sessionService: SessionService
  ) {}

  public userIsPermitted(
    entity: typeof Entity,
    operation: OperationType
  ): boolean {
    const entityConfig = this.entityConfigService.getEntityConfig(entity);
    if (entityConfig?.permissions && entityConfig.permissions[operation]) {
      return (
        entityConfig.permissions[operation].includes("admin") &&
        this.sessionService.getCurrentUser().isAdmin()
      );
    }
    return true;
  }
}
