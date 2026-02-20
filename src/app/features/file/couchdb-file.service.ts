import { inject, Injectable } from "@angular/core";
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
import { Entity } from "#src/app/core/entity/model/entity";
import { FileService } from "./file.service";
import { Logging } from "#src/app/core/logging/logging.service";
import { ObservableQueue } from "./observable-queue/observable-queue";
import { DomSanitizer, SafeUrl } from "@angular/platform-browser";
import { environment } from "#src/environments/environment";
import { NAVIGATOR_TOKEN } from "#src/app/utils/di-tokens";
import { NotAvailableOfflineError } from "#src/app/core/session/not-available-offline.error";
import { DatabaseResolverService } from "#src/app/core/database/database-resolver.service";
import { SyncedPouchDatabase } from "#src/app/core/database/pouchdb/synced-pouch-database";

/**
 * Stores the files in the CouchDB.
 * See {@link https://docs.couchdb.org/en/3.2.2-docs/intro/api.html?highlight=attachments#attachments}
 * Running upload and download processes are shown with progress bars.
 */
@Injectable()
export class CouchdbFileService extends FileService {
  private sanitizer = inject(DomSanitizer);
  private databaseResolver = inject(DatabaseResolverService);
  private navigator = inject<Navigator>(NAVIGATOR_TOKEN);

  private attachmentsUrl = `${environment.DB_PROXY_PREFIX}/${Entity.DATABASE}-attachments`;
  // TODO it seems like failed requests are executed again when a new one is done
  private requestQueue = new ObservableQueue();
  private cache: { [key: string]: Observable<string> } = {};

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
  private ensureDocIsSynced(): Observable<void> {
    const mainDb = this.databaseResolver.getDatabase();
    const syncPromise =
      (mainDb as SyncedPouchDatabase)?.ensureSynced?.() ?? Promise.resolve();
    return from(syncPromise);
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
