import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { AppSettings } from "../app-config/app-settings";
import { catchError, concatMap, map } from "rxjs/operators";
import { Observable } from "rxjs";

@Injectable()
export class FileService {
  private attachmentsUrl = `${AppSettings.DB_PROXY_PREFIX}/${AppSettings.DB_NAME}-attachments`;

  constructor(private http: HttpClient) {}

  uploadFile(file: File, entityId: string, property: string): Observable<any> {
    const attachmentId = `${this.attachmentsUrl}/${entityId}`;
    return this.http.get<{ _id: string; _rev: string }>(attachmentId).pipe(
      catchError((err) =>
        this.http
          .put<{ rev: string }>(attachmentId, {})
          .pipe(map((res) => ({ _rev: res.rev })))
      ),
      concatMap((res) =>
        this.http.put<{ ok: true }>(
          `${attachmentId}/${property}?rev=${res._rev}`,
          new Blob([file]),
          {
            headers: { "Content-Type": file.type },
          }
        )
      )
    );
  }

  showFile(entityId: string, property: string) {
    this.http
      .get(`${this.attachmentsUrl}/${entityId}/${property}`, {
        responseType: "blob",
      })
      .subscribe((res) => {
        const fileURL: any = URL.createObjectURL(res);
        const a = document.createElement("a");
        a.href = fileURL;
        a.target = "_blank";
        a.click();
      });
  }
}
