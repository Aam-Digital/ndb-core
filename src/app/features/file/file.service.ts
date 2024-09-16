import { Entity, EntityConstructor } from "../../core/entity/model/entity";
import { Observable } from "rxjs";
import { EntityMapperService } from "../../core/entity/entity-mapper/entity-mapper.service";
import { EntityRegistry } from "../../core/entity/database-entity.decorator";
import { filter, map, shareReplay } from "rxjs/operators";
import { Logging } from "../../core/logging/logging.service";
import { SafeUrl } from "@angular/platform-browser";
import { FileDatatype } from "./file.datatype";
import { waitForChangeTo } from "../../core/session/session-states/session-utils";
import { SyncState } from "../../core/session/session-states/sync-state.enum";
import { SyncStateSubject } from "../../core/session/session-type";
import {
  HttpClient,
  HttpEvent,
  HttpEventType,
  HttpProgressEvent,
  HttpResponse,
} from "@angular/common/http";
import { ProgressComponent } from "./progress/progress.component";
import { MatSnackBar } from "@angular/material/snack-bar";
import { inject, Optional } from "@angular/core";
import { ShowFileComponent } from "./show-file/show-file.component";
import { MatDialog } from "@angular/material/dialog";

/**
 * This service allow handles the logic for files/attachments.
 * Files can be uploaded, shown and removed.
 */
export abstract class FileService {
  protected snackbar: MatSnackBar = inject(MatSnackBar);
  protected dialog: MatDialog = inject(MatDialog);
  protected httpClient: HttpClient = inject(HttpClient, {
    optional: true,
  });

  protected constructor(
    protected entityMapper: EntityMapperService,
    protected entities: EntityRegistry,
    protected syncState: SyncStateSubject,
  ) {
    // TODO maybe registration is too late (only when component is rendered)
    this.syncState
      // Only start listening to changes once the initial sync has been completed
      .pipe(waitForChangeTo(SyncState.COMPLETED))
      .subscribe(() => this.deleteFilesOfDeletedEntities());
  }

  private deleteFilesOfDeletedEntities() {
    const entitiesWithFiles = this.getEntitiesWithFileDataType();
    entitiesWithFiles.forEach((entity) => {
      this.entityMapper
        .receiveUpdates(entity)
        .pipe(filter(({ type }) => type === "remove"))
        .subscribe(({ entity, type }) => {
          this.removeAllFiles(entity).subscribe({
            next: () => Logging.debug(`deleted all files of ${entity}`),
            error: (err) =>
              Logging.debug(`no files found for ${entity}: ${err}`),
          });
        });
    });
  }

  private getEntitiesWithFileDataType() {
    const entitiesWithFiles: EntityConstructor[] = [];
    for (const entity of this.entities.values()) {
      if (
        this.entityHasFileProperty(entity) &&
        !entitiesWithFiles.includes(entity)
      ) {
        entitiesWithFiles.push(entity);
      }
    }
    return entitiesWithFiles;
  }

  private entityHasFileProperty(entity: EntityConstructor): boolean {
    for (const prop of entity.schema.values()) {
      if (prop.dataType === FileDatatype.dataType) {
        return true;
      }
    }
    return false;
  }

  /**
   * Removes the file
   * @param entity
   * @param property of the entity which points to a file
   */
  abstract removeFile(entity: Entity, property: string): Observable<any>;

  /**
   * Removes all files linked with an entity
   * @param entity
   */
  abstract removeAllFiles(entity: Entity): Observable<any>;

  /**
   * If a file is available, downloads this file and shows it in a new tab.
   * @param entity
   * @param property where a file previously has been uploaded
   */
  showFile(entity: Entity, property: string): void {
    const obs = this.httpClient
      .get(this.getShowFileUrl(entity, property), {
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
  /**
   * Template method to be request a file, so that it can be used in the default showFile implementation
   */
  protected abstract getShowFileUrl(entity: Entity, property: string): string;

  /**
   * Loads the file and returns it as a blob.
   * @param entity
   * @param property
   */
  abstract loadFile(entity: Entity, property: string): Observable<SafeUrl>;

  /**
   * Uploads the file
   * @param file to be uploaded
   * @param entity
   * @param property where the information about the file should be stored
   */
  abstract uploadFile(
    file: File,
    entity: Entity,
    property: string,
  ): Observable<any>;

  protected reportProgress(
    message: string,
    obs: Observable<HttpEvent<any> | any>,
  ) {
    const progress = obs.pipe(
      filter(
        (e) =>
          e.type === HttpEventType.DownloadProgress ||
          e.type === HttpEventType.UploadProgress,
      ),
      map((e: HttpProgressEvent) => Math.round(100 * (e.loaded / e.total))),
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
