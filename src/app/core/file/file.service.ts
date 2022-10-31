import { Injectable } from "@angular/core";
import {
  HttpClient,
  HttpEventType,
  HttpProgressEvent,
  HttpResponse,
} from "@angular/common/http";
import { AppSettings } from "../app-config/app-settings";
import { catchError, concatMap, filter, map, tap } from "rxjs/operators";
import { Observable } from "rxjs";
import { MatDialog } from "@angular/material/dialog";
import { DownloadProgressComponent } from "./download-progress/download-progress.component";

@Injectable()
export class FileService {
  private attachmentsUrl = `${AppSettings.DB_PROXY_PREFIX}/${AppSettings.DB_NAME}-attachments`;

  private downloadProgress: Observable<number>;

  constructor(private http: HttpClient, private dialog: MatDialog) {}

  uploadFile(
    file: File,
    entityId: string,
    property: string,
    blob = new Blob([file])
  ): Observable<any> {
    const attachmentId = `${this.attachmentsUrl}/${entityId}`;
    return this.http.get<{ _id: string; _rev: string }>(attachmentId).pipe(
      catchError(() =>
        this.http
          .put<{ rev: string }>(attachmentId, {})
          .pipe(map((res) => ({ _rev: res.rev })))
      ),
      concatMap((res) =>
        this.http.put<{ ok: true }>(
          `${attachmentId}/${property}?rev=${res._rev}`,
          blob,
          {
            headers: { "Content-Type": file.type },
            reportProgress: true,
            observe: "events",
          }
        )
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
      }
    );
    this.downloadProgress = obs.pipe(
      filter((e) => e.type === HttpEventType.DownloadProgress),
      map((e: HttpProgressEvent) => Math.round(100 * (e.loaded / e.total)))
    );
    const ref = this.dialog.open(DownloadProgressComponent, {
      data: { progress: this.downloadProgress },
    });
    obs
      .pipe(filter((e) => e.type === HttpEventType.Response))
      .subscribe((e: HttpResponse<Blob>) => {
        const fileURL: any = URL.createObjectURL(e.body);
        const a = document.createElement("a");
        a.href = fileURL;
        a.target = "_blank";
        a.click();
        ref.close();
      });
  }
}
