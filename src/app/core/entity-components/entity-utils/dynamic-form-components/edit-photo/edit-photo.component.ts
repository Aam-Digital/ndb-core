import { Component, OnInit } from "@angular/core";
import { EditComponent } from "../edit-component";
import { Photo } from "../../../../../child-dev-project/children/child-photo-service/photo";
import { BehaviorSubject } from "rxjs";
import { ChildPhotoService } from "../../../../../child-dev-project/children/child-photo-service/child-photo.service";
import { SessionService } from "../../../../session/session-service/session.service";

@Component({
  selector: "app-edit-photo",
  templateUrl: "./edit-photo.component.html",
  styleUrls: ["./edit-photo.component.scss"],
})
export class EditPhotoComponent extends EditComponent<Photo> implements OnInit {
  editPhotoAllowed = false;

  constructor(private sessionService: SessionService) {
    super();
  }

  ngOnInit() {
    if (this.sessionService.getCurrentUser()?.roles?.includes("admin_app")) {
      this.editPhotoAllowed = true;
    }
  }

  changeFilename(path: string) {
    const newValue: Photo = {
      path: path,
      photo: new BehaviorSubject(ChildPhotoService.getImageFromAssets(path)),
    };
    this.formControl.setValue(newValue);
  }
}
