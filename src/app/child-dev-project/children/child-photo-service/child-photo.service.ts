import { Injectable, Optional } from "@angular/core";
import { SafeUrl } from "@angular/platform-browser";
import { CloudFileService } from "../../../core/webdav/cloud-file-service.service";
import { Child } from "../model/child";
import { BehaviorSubject } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class ChildPhotoService {
  public static getImageFromAssets(photoFile: string): SafeUrl {
    if (typeof photoFile !== "string" || photoFile.trim() === "") {
      return ChildPhotoService.getDefaultImage();
    }
    return ChildPhotoService.generatePhotoPath(photoFile);
  }

  /**
   * Returns the full relative filePath to a child photo given a filename, adding the relevant folders to it.
   * @param filename The given filename with file extension.
   */
  public static generatePhotoPath(filename: string): string {
    return "assets/child-photos/" + filename;
  }

  public static getDefaultImage(): SafeUrl {
    return "assets/child.png";
  }

  private basePath = "photos/";

  constructor(@Optional() private cloudFileService: CloudFileService) {}

  /**
   * Creates an ArrayBuffer of the photo for that Child or the default image url.
   * @param child
   */
  public async getImage(child: Child): Promise<SafeUrl> {
    let image = await this.getImageFromCloudService(child.entityId);
    if (!image) {
      image = ChildPhotoService.getImageFromAssets(child.photo?.path);
    }
    return image;
  }

  private async getImageFromCloudService(entityId: string): Promise<SafeUrl> {
    let image;
    if (this.cloudFileService?.isConnected()) {
      const imageType = [".png", ".jpg", ".jpeg", ""];
      for (const ext of imageType) {
        const filepath = this.basePath + entityId + ext;
        try {
          image = await this.cloudFileService.getFile(filepath);
          break;
        } catch (err) {
          if (err === "File not found") {
            // ignore and try next file extension
          } else {
            console.warn("Error loading image: ", err);
          }
        }
      }
    }
    return image;
  }

  /**
   * Load the image for the given child asynchronously, immediately returning an Observable
   * that initially emits the static image and later resolves to the image from the cloud service if one exists.
   * This allows to immediately display a proper label while the loading may take some time.
   * @param child The Child instance for which the photo should be loaded.
   */
  public getImageAsyncObservable(child: Child): BehaviorSubject<SafeUrl> {
    const resultSubject = new BehaviorSubject(
      ChildPhotoService.getImageFromAssets(child.photo?.path)
    );
    this.getImageFromCloudService(child.entityId).then((photo) => {
      if (photo && photo !== resultSubject.value) {
        resultSubject.next(photo);
      }
      resultSubject.complete();
    });
    return resultSubject;
  }

  /**
   * Check if saving/uploading images is supported in the current state.
   */
  public canSetImage(): boolean {
    return this.cloudFileService?.isConnected();
  }

  /**
   * Uploads a given image through the CloudFileService if connected.
   * @param imageFile Image to be stored
   * @param childId Id of child for which one wants to store the image
   */
  public async setImage(imageFile: any, childId: string): Promise<boolean> {
    if (!this.canSetImage()) {
      return Promise.reject("CloudFileService not connected.");
    }

    const fileExt = imageFile.name.substr(imageFile.name.lastIndexOf("."));
    return this.cloudFileService.uploadFile(
      imageFile,
      this.basePath + childId + fileExt
    );
  }
}
