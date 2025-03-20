import { inject, Injectable } from "@angular/core";
import {
  CascadingActionResult,
  CascadingEntityAction,
} from "./cascading-entity-action";
import { firstValueFrom } from "rxjs";
import { FileDatatype } from "../../../features/file/file.datatype";
import { FileService } from "../../../features/file/file.service";
import { Entity } from "../model/entity";
import { asArray } from "app/utils/asArray";
import { Logging } from "../../logging/logging.service";

/**
 * Anonymize an entity including handling references with related entities.
 * This service is usually used in combination with the `EntityActionsService`, which provides user confirmation processes around this.
 */
@Injectable({
  providedIn: "root",
})
export class EntityAnonymizeService extends CascadingEntityAction {
  private readonly fileService = inject(FileService);

  /**
   * The actual anonymize action without user interactions.
   * @param entity
   * @private
   */
  async anonymizeEntity(entity: Entity): Promise<CascadingActionResult> {
    if (!entity.getConstructor().hasPII) {
      // entity types that are generally without PII by default retain all fields
      // this should only be called through a cascade action anyway
      Logging.debug("Anonymize for entity without PII skipped", entity);
      return new CascadingActionResult();
    }

    const originalEntity = entity.copy();

    for (const [key, schema] of entity.getSchema().entries()) {
      if (entity[key] === undefined) {
        continue;
      }

      switch (schema.anonymize) {
        case "retain":
          break;
        case "retain-anonymized":
          await this.anonymizeProperty(entity, key);
          break;
        default:
          await this.removeProperty(entity, key);
      }
    }

    entity.anonymized = true;
    entity.inactive = true;

    await this.entityMapper.save(entity);

    const cascadeResult = await this.cascadeActionToRelatedEntities(
      entity,
      (e) => this.anonymizeEntity(e),
      (e) => this.keepEntityUnchanged(e),
    );

    return new CascadingActionResult([originalEntity]).mergeResults(
      cascadeResult,
    );
  }

  private async anonymizeProperty(entity: Entity, key: string) {
    const dataType = this.schemaService.getDatatypeOrDefault(
      entity.getSchema().get(key).dataType,
    );

    let anonymizedValue;
    if (entity.getSchema().get(key).isArray) {
      anonymizedValue = await Promise.all(
        asArray(entity[key]).map((v) =>
          dataType.anonymize(v, entity.getSchema().get(key), entity),
        ),
      );
    } else {
      anonymizedValue = await dataType.anonymize(
        entity[key],
        entity.getSchema().get(key),
        entity,
      );
    }
    entity[key] = anonymizedValue;
  }

  private async removeProperty(entity: Entity, key: string) {
    if (
      entity.getSchema().get(key).dataType === FileDatatype.dataType &&
      entity[key]
    ) {
      await firstValueFrom(this.fileService.removeFile(entity, key));
    }

    if (entity[key] !== undefined) {
      entity[key] = null;
    }
  }

  private async keepEntityUnchanged(e: Entity): Promise<CascadingActionResult> {
    return new CascadingActionResult([], e.getConstructor().hasPII ? [e] : []);
  }
}
