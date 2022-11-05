import { Entity } from "../entity/model/entity";
import { Observable } from "rxjs";

/**
 * This service allow handles the logic for files/attachments.
 * Files can be uploaded, shown and removed.
 */
export abstract class FileService {
  /**
   * Removes a file and updates the entity to reflect this change
   * @param entity
   * @param property of the entity which points to a file
   */
  abstract removeFile(entity: Entity, property: string): Observable<any>;

  /**
   * If a file is available, downloads this file and shows it in a new tab.
   * @param entity
   * @param property where a file previously has been uploaded
   */
  abstract showFile(entity: Entity, property: string): void;

  /**
   * Uploads the file and stores the information on `entity[property]`
   * @param file to be uploaded
   * @param entity
   * @param property where the information about the file should be stored
   */
  abstract uploadFile(
    file: File,
    entity: Entity,
    property: string
  ): Observable<any>;
}
