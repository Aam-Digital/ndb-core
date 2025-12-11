import { Injectable, inject } from "@angular/core";
import { ConfigService } from "../../config/config.service";
import { PrimaryActionConfig } from "./primary-action-config";
import { entityRegistry } from "../../entity/database-entity.decorator";
import { EntityConstructor } from "../../entity/model/entity";

/**
 * Service for managing the primary action button configuration and entity type operations.
 * This service centralizes:
 * - Default and current configuration management for the primary action button
 * - Entity type filtering logic for determining which entities support dialog-based creation
 * - Entity constructor lookup with fallback mechanisms
 */
@Injectable({
  providedIn: "root",
})
export class PrimaryActionService {
  private readonly configService = inject(ConfigService);

  /**
   * Default configuration for the primary action.
   */
  readonly defaultConfig: PrimaryActionConfig = {
    icon: "file-alt",
    actionType: "createEntity",
    entityType: "Note",
    route: "",
  };

  /**
   * Get the current primary action configuration, falling back to defaults if not configured.
   */
  getCurrentConfig(): PrimaryActionConfig {
    return (
      this.configService.getConfig<PrimaryActionConfig>("primaryAction") ??
      this.defaultConfig
    );
  }

  /**
   * Get all user-facing entity types that support dialog-based creation.
   * These are entities with schemas, labels, and proper constructor functions.
   */
  getEntityTypeOptions(): EntityConstructor[] {
    return entityRegistry
      .getEntityTypes(true)
      .map(({ value }) => value)
      .filter((ctor) => ctor.label && !ctor.isInternalEntity);
  }

  /**
   * Get entity constructor by entity type name, with fallback to Note.
   */
  getEntityConstructor(entityType?: string): EntityConstructor {
    const targetType = entityType ?? "Note";
    const entityTypes = this.getEntityTypeOptions();
    return entityTypes.find((c) => c.ENTITY_TYPE === targetType)!;
  }
}
