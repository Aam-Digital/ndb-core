import { Injectable } from "@angular/core";
import { Entity } from "../../core/entity/model/entity";
import { EMPTY, Observable, of } from "rxjs";
import { FileService } from "./file.service";
import { EntityMapperService } from "../../core/entity/entity-mapper.service";
import { EntityRegistry } from "../../core/entity/database-entity.decorator";
import { LoggingService } from "../../core/logging/logging.service";
import { DomSanitizer, SafeUrl } from "@angular/platform-browser";

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
    logger: LoggingService,
    private sanitizer: DomSanitizer,
  ) {
    super(entityMapper, entities, logger);
  }

  removeFile(entity: Entity, property: string): Observable<any> {
    this.fileMap.delete(`${entity.getId(true)}:${property}`);
    return of({ ok: true });
  }

  removeAllFiles(entity: Entity): Observable<any> {
    return EMPTY;
  }

  showFile(entity: Entity, property: string): void {
    const url = this.fileMap.get(`${entity.getId(true)}:${property}`);
    window.open(url, "_blank");
  }

  loadFile(entity: Entity, property: string): Observable<SafeUrl> {
    const url = this.fileMap.get(`${entity.getId(true)}:${property}`);
    return of(this.sanitizer.bypassSecurityTrustUrl(url));
  }

  uploadFile(file: File, entity: Entity, property: string): Observable<any> {
    const fileURL = URL.createObjectURL(file);
    this.fileMap.set(`${entity.getId(true)}:${property}`, fileURL);
    return of({ ok: true });
  }
}
