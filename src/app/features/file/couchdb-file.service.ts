import { Injectable } from "@angular/core";
import {
  HttpClient,
  HttpEvent,
  HttpEventType,
  HttpProgressEvent,
  HttpResponse,
  HttpStatusCode,
} from "@angular/common/http";
import { AppSettings } from "../../core/app-config/app-settings";
import {
  catchError,
  concatMap,
  filter,
  map,
  shareReplay,
} from "rxjs/operators";
import { Observable, of } from "rxjs";
import { MatDialog } from "@angular/material/dialog";
import { ShowFileComponent } from "./show-file/show-file.component";
import { Entity } from "../../core/entity/model/entity";
import { EntityMapperService } from "../../core/entity/entity-mapper.service";
import { FileService } from "./file.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ProgressComponent } from "./progress/progress.component";
import { EntityRegistry } from "../../core/entity/database-entity.decorator";
import { LoggingService } from "../../core/logging/logging.service";
import { ObservableQueue } from "./observable-queue/observable-queue";
import { DomSanitizer, SafeUrl } from "@angular/platform-browser";

/**
 * Stores the files in the CouchDB.
 * See {@link https://docs.couchdb.org/en/3.2.2-docs/intro/api.html?highlight=attachments#attachments}
 * Running upload and download processes are shown with progress bars.
 */
@Injectable()
export class CouchdbFileService extends FileService {
  cache: { [key: string]: SafeUrl } = {};
  private attachmentsUrl = `${AppSettings.DB_PROXY_PREFIX}/${AppSettings.DB_NAME}-attachments`;
  // TODO it seems like failed requests are executed again when a new one is done
  private requestQueue = new ObservableQueue();

  constructor(
    private sanitizer: DomSanitizer,
    private http: HttpClient,
    private dialog: MatDialog,
    private snackbar: MatSnackBar,
    entityMapper: EntityMapperService,
    entities: EntityRegistry,
    logger: LoggingService
  ) {
    super(entityMapper, entities, logger);
  }

  uploadFile(file: File, entity: Entity, property: string): Observable<any> {
    // TODO update cache if file is cached
    const obs = this.requestQueue.add(
      this.runFileUpload(file, entity, property)
    );
    this.reportProgress($localize`Uploading "${file.name}"`, obs);
    return obs;
  }

  private runFileUpload(file: File, entity: Entity, property: string) {
    const blob = new Blob([file]);
    const attachmentPath = `${this.attachmentsUrl}/${entity.getId(true)}`;
    return this.getAttachmentsDocument(attachmentPath).pipe(
      concatMap(({ _rev }) =>
        this.http.put(`${attachmentPath}/${property}?rev=${_rev}`, blob, {
          headers: { "Content-Type": file.type, "ngsw-bypass": "" },
          reportProgress: true,
          observe: "events",
        })
      ),
      // prevent http request to be executed multiple times (whenever .subscribe is called)
      shareReplay()
    );
  }

  private getAttachmentsDocument(
    attachmentPath: string
  ): Observable<{ _rev: string }> {
    return this.http.get<{ _id: string; _rev: string }>(attachmentPath).pipe(
      catchError((err) => {
        if (err.status === HttpStatusCode.NotFound) {
          return this.http
            .put<{ rev: string }>(attachmentPath, {})
            .pipe(map((res) => ({ _rev: res.rev })));
        }
        throw err;
      })
    );
  }

  removeFile(entity: Entity, property: string) {
    return this.requestQueue.add(this.runFileRemoval(entity, property));
  }

  private runFileRemoval(entity: Entity, property: string) {
    const attachmentPath = `${this.attachmentsUrl}/${entity.getId(true)}`;
    return this.http.get<{ _rev: string }>(attachmentPath).pipe(
      concatMap(({ _rev }) =>
        this.http.delete(`${attachmentPath}/${property}?rev=${_rev}`)
      ),
      catchError((err) => {
        if (err.status === HttpStatusCode.NotFound) {
          return of({ ok: true });
        } else {
          throw err;
        }
      })
    );
  }

  removeAllFiles(entity: Entity): Observable<any> {
    return this.requestQueue.add(this.runAllFilesRemoval(entity));
  }

  private runAllFilesRemoval(entity: Entity) {
    const attachmentPath = `${this.attachmentsUrl}/${entity.getId(true)}`;
    return this.http
      .get<{ _rev: string }>(attachmentPath)
      .pipe(
        concatMap(({ _rev }) =>
          this.http.delete(`${attachmentPath}?rev=${_rev}`)
        )
      );
  }

  showFile(entity: Entity, property: string) {
    const obs = this.http
      .get(`${this.attachmentsUrl}/${entity.getId(true)}/${property}`, {
        responseType: "blob",
        reportProgress: true,
        observe: "events",
        headers: { "ngsw-bypass": "" },
      })
      .pipe(shareReplay());
    this.reportProgress($localize`Loading "${entity[property]}"`, obs);
    obs
      .pipe(filter((e) => e.type === HttpEventType.Response))
      .subscribe((e: HttpResponse<Blob>) => {
        const fileURL = URL.createObjectURL(e.body);
        const win = window.open(fileURL, "_blank");
        if (!win || win.closed || typeof win.closed == "undefined") {
          // When it takes more than a few (2-5) seconds to open the file, the browser might block the popup
          this.dialog.open(ShowFileComponent, { data: fileURL });
        }
      });
  }

  loadFile(entity: Entity, property: string) {
    const path = `${entity.getId(true)}/${property}`;
    if (this.cache[path]) {
      return of(this.cache[path]);
    }
    return this.http
      .get(`${this.attachmentsUrl}/${path}`, {
        responseType: "blob",
        headers: { "ngsw-bypass": "" },
      })
      .pipe(
        map((blob) => {
          const url = URL.createObjectURL(blob);
          const safe = this.sanitizer.bypassSecurityTrustUrl(url);
          this.cache[path] = safe;
          return safe;
        })
      );
  }

  private reportProgress(message: string, obs: Observable<HttpEvent<any>>) {
    const progress = obs.pipe(
      filter(
        (e) =>
          e.type === HttpEventType.DownloadProgress ||
          e.type === HttpEventType.UploadProgress
      ),
      map((e: HttpProgressEvent) => Math.round(100 * (e.loaded / e.total)))
    );
    const ref = this.snackbar.openFromComponent(ProgressComponent, {
      data: { message, progress },
    });
    progress.subscribe({
      complete: () => ref.dismiss(),
      error: () => ref.dismiss(),
    });
  }
}
