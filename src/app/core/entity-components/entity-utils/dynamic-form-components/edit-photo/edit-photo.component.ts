import { Component } from "@angular/core";
import { EditComponent } from "../edit-component";
import { Photo } from "../../../../../child-dev-project/children/child-photo-service/photo";
import { BehaviorSubject } from "rxjs";
import { ChildPhotoService } from "../../../../../child-dev-project/children/child-photo-service/child-photo.service";
import { SessionService } from "../../../../session/session-service/session.service";
import { DynamicComponent } from "../../../../view/dynamic-components/dynamic-component.decorator";
import { NgIf } from "@angular/common";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatInputModule } from "@angular/material/input";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";

@DynamicComponent("EditPhoto")
@Component({
  selector: "app-edit-photo",
  templateUrl: "./edit-photo.component.html",
  styleUrls: ["./edit-photo.component.scss"],
  imports: [
    NgIf,
    MatFormFieldModule,
    MatTooltipModule,
    MatInputModule,
    FontAwesomeModule,
  ],
  standalone: true,
})
export class EditPhotoComponent extends EditComponent<Photo> {
  editPhotoAllowed = false;

  constructor(private sessionService: SessionService) {
    super();
  }

  ngOnInit() {
    super.ngOnInit();
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
