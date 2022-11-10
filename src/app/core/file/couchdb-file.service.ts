import { Injectable } from "@angular/core";
import {
  HttpClient,
  HttpEvent,
  HttpEventType,
  HttpProgressEvent,
  HttpResponse,
} from "@angular/common/http";
import { AppSettings } from "../app-config/app-settings";
import {
  catchError,
  concatMap,
  filter,
  finalize,
  map,
  shareReplay,
} from "rxjs/operators";
import { Observable } from "rxjs";
import { MatDialog } from "@angular/material/dialog";
import { ShowFileComponent } from "./show-file/show-file.component";
import { Entity } from "../entity/model/entity";
import { EntityMapperService } from "../entity/entity-mapper.service";
import { FileService } from "./file.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ProgressComponent } from "./progress/progress.component";
import { EntityRegistry } from "../entity/database-entity.decorator";

/**
 * Stores the files in the CouchDB.
 * See {@link https://docs.couchdb.org/en/3.2.2-docs/intro/api.html?highlight=attachments#attachments}
 * Running upload and download processes are shown with progress bars.
 */
@Injectable()
export class CouchdbFileService extends FileService {
  private attachmentsUrl = `${AppSettings.DB_PROXY_PREFIX}/${AppSettings.DB_NAME}-attachments`;

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    entityMapper: EntityMapperService,
    private snackbar: MatSnackBar,
    entities: EntityRegistry
  ) {
    super(entityMapper, entities);
  }

  uploadFile(file: File, entity: Entity, property: string): Observable<any> {
    const blob = new Blob([file]);
    const attachmentPath = `${this.attachmentsUrl}/${entity._id}`;
    const obs = this.getAttachmentsDocument(attachmentPath).pipe(
      concatMap(({ _rev }) =>
        this.http.put(`${attachmentPath}/${property}?rev=${_rev}`, blob, {
          headers: { "Content-Type": file.type, "ngsw-bypass": "" },
          reportProgress: true,
          observe: "events",
        })
      ),
      finalize(() => {
        entity[property] = file.name;
        this.entityMapper.save(entity);
      }),
      // prevent http request to be executed multiple times (whenever .subscribe is called)
      shareReplay()
    );
    this.reportProgress($localize`Uploading "${file.name}"`, obs);
    return obs;
  }

  private getAttachmentsDocument(
    attachmentPath: string
  ): Observable<{ _rev: string }> {
    return this.http.get<{ _id: string; _rev: string }>(attachmentPath).pipe(
      catchError((err) => {
        if (err.status === 404) {
          return this.http
            .put<{ rev: string }>(attachmentPath, {})
            .pipe(map((res) => ({ _rev: res.rev })));
        }
        throw err;
      })
    );
  }

  removeFile(entity: Entity, property: string) {
    const attachmentPath = `${this.attachmentsUrl}/${entity._id}`;
    return this.http.get<{ _rev: string }>(attachmentPath).pipe(
      concatMap(({ _rev }) =>
        this.http.delete(`${attachmentPath}/${property}?rev=${_rev}`)
      ),
      finalize(async () => {
        entity[property] = undefined;
        await this.entityMapper.save(entity);
      })
    );
  }

  removeAllFiles(entity: Entity): Observable<any> {
    const attachmentPath = `${this.attachmentsUrl}/${entity._id}`;
    return this.http
      .get<{ _rev: string }>(attachmentPath)
      .pipe(
        concatMap(({ _rev }) =>
          this.http.delete(`${attachmentPath}/?rev=${_rev}`)
        )
      );
  }

  showFile(entity: Entity, property: string) {
    const obs = this.http.get(
      `${this.attachmentsUrl}/${entity._id}/${property}`,
      {
        responseType: "blob",
        reportProgress: true,
        observe: "events",
        headers: { "ngsw-bypass": "" },
      }
    );
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
