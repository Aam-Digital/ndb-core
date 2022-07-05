import { Injectable } from "@angular/core";
import { SafeUrl } from "@angular/platform-browser";
import { Child } from "../model/child";

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

  /**
   * Creates an ArrayBuffer of the photo for that Child or the default image url.
   * @param child
   */
  public async getImage(child: Child): Promise<SafeUrl> {
    return ChildPhotoService.getImageFromAssets(child.photo?.path);
  }
}
