import { Injectable } from "@angular/core";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import { HttpClient } from "@angular/common/http";
import { Child } from "../../../child-dev-project/children/model/child";
import { ChildPhotoService } from "../../../child-dev-project/children/child-photo-service/child-photo.service";
import { firstValueFrom } from "rxjs";

/**
 * Utility service to automatically detect and update filenames for Child entities' photos.
 */
@Injectable({
  providedIn: "root",
})
export class ChildPhotoUpdateService {
  constructor(
    private entityService: EntityMapperService,
    private httpClient: HttpClient
  ) {}

  /**
   * Tries to detect and update the filename of an existing photo for all Child entities,
   * saving the entities that were updated.
   */
  public async updateChildrenPhotoFilenames() {
    const children = await this.entityService.loadType<Child>(Child);
    for (const child of children) {
      await this.updatePhotoIfFileExists(child, `${child.projectNumber}.png`);
      await this.updatePhotoIfFileExists(child, `${child.projectNumber}.jpg`);
    }
  }

  /**
   * Check (and if it exists update) the Child's photo file.
   * @param child The child to be updated
   * @param filename A guess for a likely filename that needs to be checked
   */
  private async updatePhotoIfFileExists(child: Child, filename: string) {
    if (child.photo?.path && child.photo.path !== "") {
      // do not overwrite existing path
      return;
    }

    const fileExists = await this.checkIfFileExists(
      ChildPhotoService.generatePhotoPath(filename)
    );
    if (fileExists) {
      const currentPhoto = child.photo;
      child.photo = { path: filename, photo: currentPhoto?.photo };
      this.entityService.save<Child>(child);
      console.log(
        `set photoFile for Child:${child.getId()} (${
          child.projectNumber
        }) to ${filename}`
      );
    }
  }

  private async checkIfFileExists(filename): Promise<boolean> {
    try {
      await firstValueFrom(this.httpClient.get(filename));
      return true;
    } catch (e) {
      return e.status === 200;
    }
  }
}
