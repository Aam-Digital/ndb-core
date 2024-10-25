import { Inject, Injectable } from "@angular/core";
import { HttpStatusCode } from "@angular/common/http";
import {
  catchError,
  concatMap,
  last,
  map,
  shareReplay,
  tap,
} from "rxjs/operators";
import { from, Observable, of, throwError } from "rxjs";
import { Entity } from "../../core/entity/model/entity";
import { EntityMapperService } from "../../core/entity/entity-mapper/entity-mapper.service";
import { FileService } from "./file.service";
import { EntityRegistry } from "../../core/entity/database-entity.decorator";
import { Logging } from "../../core/logging/logging.service";
import { ObservableQueue } from "./observable-queue/observable-queue";
import { DomSanitizer, SafeUrl } from "@angular/platform-browser";
import { SyncStateSubject } from "../../core/session/session-type";
import { SyncService } from "../../core/database/sync.service";
import { SyncState } from "../../core/session/session-states/sync-state.enum";
import { environment } from "../../../environments/environment";
import { NAVIGATOR_TOKEN } from "../../utils/di-tokens";
import { NotAvailableOfflineError } from "../../core/session/not-available-offline.error";

/**
 * Stores the files in the CouchDB.
 * See {@link https://docs.couchdb.org/en/3.2.2-docs/intro/api.html?highlight=attachments#attachments}
 * Running upload and download processes are shown with progress bars.
 */
@Injectable()
export class CouchdbFileService extends FileService {
  private attachmentsUrl = `${environment.DB_PROXY_PREFIX}/${environment.DB_NAME}-attachments`;
  // TODO it seems like failed requests are executed again when a new one is done
  private requestQueue = new ObservableQueue();
  private cache: { [key: string]: Observable<string> } = {};

  constructor(
    private sanitizer: DomSanitizer,
    private syncService: SyncService,
    entityMapper: EntityMapperService,
    entities: EntityRegistry,
    syncState: SyncStateSubject,
    @Inject(NAVIGATOR_TOKEN) private navigator: Navigator,
  ) {
    super(entityMapper, entities, syncState);
  }

  uploadFile(file: File, entity: Entity, property: string): Observable<any> {
    if (!this.navigator.onLine) {
      return throwError(() => new NotAvailableOfflineError("File Attachments"));
    }

    const obs = this.requestQueue.add(
      this.runFileUpload(file, entity, property),
    );
    this.reportProgress($localize`Uploading "${file.name}"`, obs);
    this.cache[`${entity.getId()}/${property}`] = obs.pipe(
      last(),
      map(() => URL.createObjectURL(file)),
      shareReplay(),
    );
    return obs;
  }

  private runFileUpload(file: File, entity: Entity, property: string) {
    const attachmentPath = `${this.attachmentsUrl}/${entity.getId()}`;
    return this.ensureDocIsSynced().pipe(
      concatMap(() => this.getAttachmentsDocument(attachmentPath)),
      concatMap(({ _rev }) =>
        this.httpClient.put(`${attachmentPath}/${property}?rev=${_rev}`, file, {
          headers: { "ngsw-bypass": "" },
          reportProgress: true,
          observe: "events",
        }),
      ),
      // prevent http request to be executed multiple times (whenever .subscribe is called)
      shareReplay(),
    );
  }

  /**
   * For permission checks to work correctly, the Entity must be available server-side already.
   * Manually send this doc to the DB here because sync is only happening at slower intervals.
   * @private
   */
  private ensureDocIsSynced(): Observable<SyncState> {
    return from(this.syncService.sync()).pipe(map(() => this.syncState.value));
  }

  private getAttachmentsDocument(
    attachmentPath: string,
  ): Observable<{ _rev: string }> {
    return this.httpClient
      .get<{ _id: string; _rev: string }>(attachmentPath)
      .pipe(
        catchError((err) => {
          if (err.status === HttpStatusCode.NotFound) {
            return this.httpClient
              .put<{ rev: string }>(attachmentPath, {})
              .pipe(map((res) => ({ _rev: res.rev })));
          }
          throw err;
        }),
      );
  }

  removeFile(entity: Entity, property: string) {
    if (!this.navigator.onLine) {
      return throwError(() => new NotAvailableOfflineError("File Attachments"));
    }

    return this.requestQueue.add(this.runFileRemoval(entity, property));
  }

  private runFileRemoval(entity: Entity, property: string) {
    const path = `${entity.getId()}/${property}`;
    return this.httpClient
      .get<{ _rev: string }>(`${this.attachmentsUrl}/${entity.getId()}`)
      .pipe(
        concatMap(({ _rev }) =>
          this.httpClient.delete(`${this.attachmentsUrl}/${path}?rev=${_rev}`),
        ),
        tap(() => delete this.cache[path]),
        catchError((err) => {
          if (err.status === HttpStatusCode.NotFound) {
            return of({ ok: true });
          } else {
            throw err;
          }
        }),
      );
  }

  removeAllFiles(entity: Entity): Observable<any> {
    return this.requestQueue.add(this.runAllFilesRemoval(entity));
  }

  private runAllFilesRemoval(entity: Entity) {
    const attachmentPath = `${this.attachmentsUrl}/${entity.getId()}`;
    return this.httpClient
      .get<{ _rev: string }>(attachmentPath)
      .pipe(
        concatMap(({ _rev }) =>
          this.httpClient.delete(`${attachmentPath}?rev=${_rev}`),
        ),
      );
  }

  protected override getShowFileUrl(entity: Entity, property: string): string {
    return `${this.attachmentsUrl}/${entity.getId()}/${property}`;
  }

  loadFile(
    entity: Entity,
    property: string,
    throwErrors: boolean = false,
  ): Observable<SafeUrl> {
    const path = `${entity.getId()}/${property}`;
    if (!this.cache[path]) {
      this.cache[path] = this.httpClient
        .get(`${this.attachmentsUrl}/${path}`, {
          responseType: "blob",
        })
        .pipe(
          map((blob) => URL.createObjectURL(blob)),
          catchError((err) => {
            Logging.warn("Could not load file", entity?.getId(), property, err);

            if (throwErrors) {
              throw err;
            } else {
              return of("");
            }
          }),
          shareReplay(),
        );
    }
    return this.cache[path].pipe(
      map((url) => this.sanitizer.bypassSecurityTrustUrl(url)),
    );
  }
}
