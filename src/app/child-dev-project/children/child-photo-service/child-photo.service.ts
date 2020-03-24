import { Injectable } from '@angular/core';
import { SafeUrl } from '@angular/platform-browser';
import { CloudFileService } from '../../../core/webdav/cloud-file-service.service';

@Injectable({
  providedIn: 'root',
})
export class ChildPhotoService {
  private basePath = 'photos/';

  constructor(
    private cloudFileService: CloudFileService,
  ) { }

  /**
   * Creates an ArrayBuffer of the photo for that Child or the default image url.
   * @param childId
   */
  public async getImage(childId: string): Promise<SafeUrl> {
    let image: SafeUrl = this.getDefaultImage();

    if (this.cloudFileService.isConnected()) {
      const imageType = [ '.png' , '.jpg', '.jpeg', '' ];
      for (const ext of imageType) {
        const filepath = this.basePath + childId + ext;
        try {
          image = await this.cloudFileService.getFile(filepath);
          break;
        } catch (err) {
          if (err === 'File not found') {
            // ignore and try next file extension
          } else {
            console.warn('Error loading image: ', err);
          }
        }
      }
    }

    return image;
  }

  private getDefaultImage(): SafeUrl {
    return 'assets/child.png';
  }


  /**
   * Check if saving/uploading images is supported in the current state.
   */
  public canSetImage(): boolean {
    return this.cloudFileService.isConnected();
  }

  /**
   * Uploads a given image through the CloudFileService if connected.
   * @param imageFile Image to be stored
   * @param childId Id of child for which one wants to store the image
   */
  public async setImage(imageFile: any, childId: string): Promise<void> {
    if (!this.canSetImage()) {
      return Promise.reject('CloudFileService not connected.');
    }

    const fileExt = imageFile.name.substr(imageFile.name.lastIndexOf('.'));
    return this.cloudFileService.uploadFile(imageFile, this.basePath + childId + fileExt);
  }
}
