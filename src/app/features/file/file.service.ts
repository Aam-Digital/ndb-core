import { Entity, EntityConstructor } from "../../core/entity/model/entity";
import { Observable } from "rxjs";
import { EntityMapperService } from "../../core/entity/entity-mapper.service";
import { EntityRegistry } from "../../core/entity/database-entity.decorator";
import { fileDataType } from "./file-data-type";
import { filter } from "rxjs/operators";
import { LoggingService } from "../../core/logging/logging.service";
import { SafeUrl } from "@angular/platform-browser";

/**
 * This service allow handles the logic for files/attachments.
 * Files can be uploaded, shown and removed.
 */
export abstract class FileService {
  protected constructor(
    private entityMapper: EntityMapperService,
    private entities: EntityRegistry,
    private logger: LoggingService
  ) {
    // TODO maybe registration is to late (only when component is rendered)
    this.deleteFilesOfDeletedEntities();
  }

  private deleteFilesOfDeletedEntities() {
    const entitiesWithFiles = this.getEntitiesWithFileDataType();
    entitiesWithFiles.forEach((entity) => {
      this.entityMapper
        .receiveUpdates(entity)
        .pipe(filter(({ type }) => type === "remove"))
        .subscribe(({ entity, type }) => {
          this.removeAllFiles(entity).subscribe({
            next: () => this.logger.debug(`deleted all files of ${entity}`),
            error: (err) =>
              this.logger.debug(`no files found for ${entity}: ${err}`),
          });
        });
    });
  }

  private getEntitiesWithFileDataType() {
    const entitiesWithFiles: EntityConstructor[] = [];
    for (const entity of this.entities.values()) {
      if (
        this.entityHasFileProperty(entity) &&
        !entitiesWithFiles.includes(entity)
      ) {
        entitiesWithFiles.push(entity);
      }
    }
    return entitiesWithFiles;
  }

  private entityHasFileProperty(entity: EntityConstructor): boolean {
    for (const prop of entity.schema.values()) {
      if (prop.dataType === fileDataType.name) {
        return true;
      }
    }
    return false;
  }

  /**
   * Removes the file
   * @param entity
   * @param property of the entity which points to a file
   */
  abstract removeFile(entity: Entity, property: string): Observable<any>;

  /**
   * Removes all files linked with an entity
   * @param entity
   */
  abstract removeAllFiles(entity: Entity): Observable<any>;

  /**
   * If a file is available, downloads this file and shows it in a new tab.
   * @param entity
   * @param property where a file previously has been uploaded
   */
  abstract showFile(entity: Entity, property: string): void;

  abstract loadFile(entity: Entity, property: string): Observable<SafeUrl>;

  /**
   * Uploads the file
   * @param file to be uploaded
   * @param entity
   * @param property where the information about the file should be stored
   * @param compression
   */
  abstract uploadFile(
    file: File,
    entity: Entity,
    property: string,
    compression?: number
  ): Observable<any>;
}
