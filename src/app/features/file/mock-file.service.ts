import { Injectable } from "@angular/core";
import { Entity } from "../../core/entity/model/entity";
import { EMPTY, Observable, of } from "rxjs";
import { FileService } from "./file.service";
import { EntityMapperService } from "../../core/entity/entity-mapper.service";
import { EntityRegistry } from "../../core/entity/database-entity.decorator";
import { LoggingService } from "../../core/logging/logging.service";

/**
 * A mock implementation of the file service which only stores the file temporarily in the browser.
 * This can be used in the demo mode.
 * NO FILES ARE UPLOADED OR DOWNLOADED
 */
@Injectable()
export class MockFileService extends FileService {
  private fileMap = new Map<string, string>();

  constructor(
    entityMapper: EntityMapperService,
    entities: EntityRegistry,
    logger: LoggingService
  ) {
    super(entityMapper, entities, logger);
  }

  removeFile(entity: Entity, property: string): Observable<any> {
    this.fileMap.delete(entity[property]);
    entity[property] = undefined;
    return of(this.entityMapper.save(entity));
  }

  removeAllFiles(entity: Entity): Observable<any> {
    return EMPTY;
  }

  showFile(entity: Entity, property: string): void {
    window.open(this.fileMap.get(entity[property]), "_blank");
  }

  uploadFile(file: File, entity: Entity, property: string): Observable<any> {
    const fileURL = URL.createObjectURL(file);
    this.fileMap.set(file.name, fileURL);
    entity[property] = file.name;
    return of(this.entityMapper.save(entity));
  }
}
