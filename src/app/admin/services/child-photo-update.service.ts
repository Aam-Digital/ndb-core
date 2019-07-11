import { Injectable } from '@angular/core';
import {EntityMapperService} from '../../entity/entity-mapper.service';
import {HttpClient} from '@angular/common/http';
import {Child} from '../../children/child';

@Injectable({
  providedIn: 'root'
})
export class ChildPhotoUpdateService {

  constructor(
    private entityService: EntityMapperService,
    private httpClient: HttpClient,
    ) { }

  public async updateChildrenPhotoFilenames() {
    const children = await this.entityService.loadType<Child>(Child);
    for (const child of children) {
      await this.updatePhotoIfFileExists(child, `${child.projectNumber}.png`);
      await this.updatePhotoIfFileExists(child, `${child.projectNumber}.jpg`);
    }
  }

  private async updatePhotoIfFileExists(child: Child, filename: string) {
    if (child.photoFile && child.photoFile !== '') {
      // do not overwrite existing path
      return;
    }

    const fileExists = await this.checkIfFileExists(Child.generatePhotoPath(filename));
    if (fileExists) {
      child.photoFile = filename;
      this.entityService.save<Child>(child);
      console.log(`set photoFile for Child:${child.getId()} (${child.projectNumber}) to ${filename}`);
    }
  }

  private async checkIfFileExists(filename): Promise<boolean> {
    try {
      await this.httpClient.get(filename).toPromise();
      return true;
    } catch (e) {
      if (e.status === 200) {
        return true;
      }
      return false;
    }
  }
}
