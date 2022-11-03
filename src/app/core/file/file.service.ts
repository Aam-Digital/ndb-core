import { Injectable } from "@angular/core";
import {
  HttpClient,
  HttpEventType,
  HttpProgressEvent,
  HttpResponse,
} from "@angular/common/http";
import { AppSettings } from "../app-config/app-settings";
import { catchError, concatMap, filter, map } from "rxjs/operators";
import { Observable } from "rxjs";
import { AlertService } from "../alerts/alert.service";
import { MatDialog } from "@angular/material/dialog";
import { ShowFileComponent } from "./show-file/show-file.component";

@Injectable()
export class FileService {
  private attachmentsUrl = `${AppSettings.DB_PROXY_PREFIX}/${AppSettings.DB_NAME}-attachments`;

  constructor(
    private http: HttpClient,
    private alerts: AlertService,
    private dialog: MatDialog
  ) {}

  uploadFile(
    file: File,
    entityId: string,
    property: string,
    blob = new Blob([file])
  ): Observable<any> {
    const attachmentPath = `${this.attachmentsUrl}/${entityId}`;
    return this.getAttachmentsDocument(attachmentPath).pipe(
      concatMap(({ _rev }) =>
        this.http.put<{ ok: true }>(
          `${attachmentPath}/${property}?rev=${_rev}`,
          blob,
          {
            headers: { "Content-Type": file.type, "ngsw-bypass": "" },
            reportProgress: true,
            observe: "events",
          }
        )
      )
    );
  }

  private getAttachmentsDocument(attachmentPath: string) {
    return this.http
      .get<{ _id: string; _rev: string }>(attachmentPath)
      .pipe(
        catchError(() =>
          this.http
            .put<{ rev: string }>(attachmentPath, {})
            .pipe(map((res) => ({ _rev: res.rev })))
        )
      );
  }

  removeFile(entityId: string, property: string) {
    const attachmentPath = `${this.attachmentsUrl}/${entityId}`;
    return this.getAttachmentsDocument(attachmentPath).pipe(
      concatMap(({ _rev }) =>
        this.http.delete(`${attachmentPath}/${property}?rev=${_rev}`)
      )
    );
  }

  showFile(entityId: string, property: string) {
    const obs = this.http.get(
      `${this.attachmentsUrl}/${entityId}/${property}`,
      {
        responseType: "blob",
        reportProgress: true,
        observe: "events",
        headers: { "ngsw-bypass": "" },
      }
    );
    const progress = obs.pipe(
      filter((e) => e.type === HttpEventType.DownloadProgress),
      map((e: HttpProgressEvent) => Math.round(100 * (e.loaded / e.total)))
    );
    const alert = this.alerts.addProgress($localize`Loading...`, progress);
    obs
      .pipe(filter((e) => e.type === HttpEventType.Response))
      .subscribe((e: HttpResponse<Blob>) => {
        const fileURL = URL.createObjectURL(e.body);
        const win = window.open(fileURL, "_blank");
        if (!win || win.closed || typeof win.closed == "undefined") {
          // When it takes more than a few (2-5) seconds to open the file, the browser might block the popup
          this.dialog.open(ShowFileComponent, { data: fileURL });
        }
        this.alerts.removeAlert(alert);
      });
  }
}
