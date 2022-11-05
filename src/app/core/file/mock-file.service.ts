import { Injectable } from "@angular/core";
import { Entity } from "../entity/model/entity";
import { Observable, of } from "rxjs";
import { FileService } from "./file.service";
import { EntityMapperService } from "../entity/entity-mapper.service";

@Injectable()
export class MockFileService extends FileService {
  private fileMap = new Map<string, string>();

  constructor(private entityMapper: EntityMapperService) {
    super();
  }

  removeFile(entity: Entity, property: string): Observable<any> {
    this.fileMap.delete(entity[property]);
    entity[property] = undefined;
    return of(this.entityMapper.save(entity));
  }

  showFile(entity: Entity, property: string): void {
    window.open(this.fileMap.get(entity[property]), "_blank");
  }

  uploadFile(file: File, entity: Entity, property: string): Observable<any> {
    const fileURL = URL.createObjectURL(file);
    this.fileMap.set(file.name, fileURL);
    entity[property] = file.name;
    return of(this.entityMapper.save(entity));
  }
}
