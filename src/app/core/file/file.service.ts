import { Injectable } from "@angular/core";
import {
  HttpClient,
  HttpEvent,
  HttpEventType,
  HttpProgressEvent,
  HttpResponse,
} from "@angular/common/http";
import { AppSettings } from "../app-config/app-settings";
import { catchError, concatMap, filter, finalize, map } from "rxjs/operators";
import { Observable } from "rxjs";
import { AlertService } from "../alerts/alert.service";
import { MatDialog } from "@angular/material/dialog";
import { ShowFileComponent } from "./show-file/show-file.component";
import { Entity } from "../entity/model/entity";
import { EntityMapperService } from "../entity/entity-mapper.service";
import { Alert } from "../alerts/alert";

@Injectable()
export class FileService {
  private attachmentsUrl = `${AppSettings.DB_PROXY_PREFIX}/${AppSettings.DB_NAME}-attachments`;

  constructor(
    private http: HttpClient,
    private alerts: AlertService,
    private dialog: MatDialog,
    private entityMapper: EntityMapperService
  ) {}

  uploadFile(
    file: File,
    entity: Entity,
    property: string,
    blob = new Blob([file])
  ): Observable<any> {
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
      })
    );
    const alert = this.reportProgress($localize`Uploading "${file.name}"`, obs);
    return obs.pipe(finalize(() => this.alerts.removeAlert(alert)));
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
    return this.getAttachmentsDocument(attachmentPath).pipe(
      concatMap(({ _rev }) =>
        this.http.delete(`${attachmentPath}/${property}?rev=${_rev}`)
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
    const alert = this.reportProgress(
      $localize`Loading "${entity[property]}"`,
      obs
    );
    obs
      .pipe(
        filter((e) => e.type === HttpEventType.Response),
        finalize(() => this.alerts.removeAlert(alert))
      )
      .subscribe((e: HttpResponse<Blob>) => {
        const fileURL = URL.createObjectURL(e.body);
        const win = window.open(fileURL, "_blank");
        if (!win || win.closed || typeof win.closed == "undefined") {
          // When it takes more than a few (2-5) seconds to open the file, the browser might block the popup
          this.dialog.open(ShowFileComponent, { data: fileURL });
        }
      });
  }

  private reportProgress(
    message: string,
    obs: Observable<HttpEvent<any>>
  ): Alert {
    const progress = obs.pipe(
      filter(
        (e) =>
          e.type === HttpEventType.DownloadProgress ||
          e.type === HttpEventType.UploadProgress
      ),
      map((e: HttpProgressEvent) => Math.round(100 * (e.loaded / e.total)))
    );
    return this.alerts.addProgress(message, progress);
  }
}
