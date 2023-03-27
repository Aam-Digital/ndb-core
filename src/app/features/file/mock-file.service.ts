import { Injectable } from "@angular/core";
import { Entity } from "../../core/entity/model/entity";
import { EMPTY, Observable, of } from "rxjs";
import { FileService } from "./file.service";
import { EntityMapperService } from "../../core/entity/entity-mapper.service";
import { EntityRegistry } from "../../core/entity/database-entity.decorator";
import { LoggingService } from "../../core/logging/logging.service";
import { DomSanitizer, SafeUrl } from "@angular/platform-browser";
import { fromPromise } from "rxjs/internal/observable/innerFrom";
import { resizeImage } from "./file-utils";
import { map, tap } from "rxjs/operators";

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
    private sanitizer: DomSanitizer
  ) {
    super(entityMapper, entities, logger);
  }

  removeFile(entity: Entity, property: string): Observable<any> {
    this.fileMap.delete(entity + property);
    return of({ ok: true });
  }

  removeAllFiles(entity: Entity): Observable<any> {
    return EMPTY;
  }

  showFile(entity: Entity, property: string): void {
    window.open(this.fileMap.get(entity + property), "_blank");
  }

  loadFile(entity: Entity, property: string): Observable<SafeUrl> {
    return of(
      this.sanitizer.bypassSecurityTrustUrl(this.fileMap.get(entity + property))
    );
  }

  uploadFile(
    file: File,
    entity: Entity,
    property: string,
    compression?: number
  ): Observable<any> {
    let dataUrl: Observable<string>;
    if (compression) {
      dataUrl = fromPromise(resizeImage(file, compression)).pipe(
        map((cvs) => cvs.toDataURL())
      );
    } else {
      dataUrl = of(URL.createObjectURL(file));
    }
    return dataUrl.pipe(
      tap((url) => this.fileMap.set(entity + property, url)),
      map(() => ({ ok: true }))
    );
  }
}
