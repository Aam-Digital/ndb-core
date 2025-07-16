import { inject, Injectable } from "@angular/core";
import { Entity } from "../../core/entity/model/entity";
import { EMPTY, Observable, of } from "rxjs";
import { FileService } from "./file.service";
import { DomSanitizer, SafeUrl } from "@angular/platform-browser";

/**
 * A mock implementation of the file service which only stores the file temporarily in the browser.
 * This can be used in the demo mode.
 * NO FILES ARE UPLOADED OR DOWNLOADED
 */
@Injectable()
export class MockFileService extends FileService {
  private sanitizer = inject(DomSanitizer);

  private fileMap = new Map<string, string>();

  removeFile(entity: Entity, property: string): Observable<any> {
    this.fileMap.delete(`${entity.getId()}:${property}`);
    return of({ ok: true });
  }

  removeAllFiles(entity: Entity): Observable<any> {
    return EMPTY;
  }

  override showFile(entity: Entity, property: string): void {
    const url = this.fileMap.get(`${entity.getId()}:${property}`);
    window.open(url, "_blank");
  }

  protected override getShowFileUrl(entity: Entity, property: string): string {
    return "";
  }

  loadFile(entity: Entity, property: string): Observable<SafeUrl> {
    const url = this.fileMap.get(`${entity.getId()}:${property}`);
    return of(this.sanitizer.bypassSecurityTrustUrl(url));
  }

  uploadFile(file: File, entity: Entity, property: string): Observable<any> {
    const fileURL = URL.createObjectURL(file);
    this.fileMap.set(`${entity.getId()}:${property}`, fileURL);
    return of({ ok: true });
  }
}
