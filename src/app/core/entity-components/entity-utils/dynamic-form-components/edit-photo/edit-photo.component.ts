import { Component } from "@angular/core";
import { EditComponent } from "../edit-component";
import { Photo } from "../../../../../child-dev-project/children/child-photo-service/photo";
import { BehaviorSubject } from "rxjs";
import { ChildPhotoService } from "../../../../../child-dev-project/children/child-photo-service/child-photo.service";
import { SessionService } from "../../../../session/session-service/session.service";
import { User } from "../../../../user/user";

@Component({
  selector: "app-edit-photo",
  templateUrl: "./edit-photo.component.html",
  styleUrls: ["./edit-photo.component.scss"],
})
export class EditPhotoComponent extends EditComponent<Photo> {
  user: User;
  constructor(private sessionService: SessionService) {
    super();
    this.user = this.sessionService.getCurrentUser();
  }

  changeFilename(path: string) {
    const newValue: Photo = {
      path: path,
      photo: new BehaviorSubject(ChildPhotoService.getImageFromAssets(path)),
    };
    this.formControl.setValue(newValue);
  }
}
