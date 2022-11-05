import { Entity } from "../entity/model/entity";
import { Observable } from "rxjs";

export abstract class FileService {
  abstract removeFile(entity: Entity, property: string): Observable<Object>;

  abstract showFile(entity: Entity, property: string): void;

  abstract uploadFile(
    file: File,
    entity: Entity,
    property: string,
    blob?: Blob
  ): Observable<any>;
}
