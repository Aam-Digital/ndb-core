import { Component } from "@angular/core";
import { EditComponent, EditPropertyConfig } from "../edit-component";
import { CouchdbFileService } from "../../../../../features/file/couchdb-file.service";
import { SafeUrl } from "@angular/platform-browser";
import { EditFileComponent } from "../../../../../features/file/edit-file/edit-file.component";
import { NgIf } from "@angular/common";

@Component({
  selector: "app-new-photo",
  standalone: true,
  imports: [EditFileComponent, NgIf],
  templateUrl: "./new-photo.component.html",
  styleUrls: ["./new-photo.component.scss"],
})
export class NewPhotoComponent extends EditComponent<string> {
  imgPath: SafeUrl;

  constructor(private fileService: CouchdbFileService) {
    super();
  }

  onInitFromDynamicConfig(config: EditPropertyConfig<string>) {
    super.onInitFromDynamicConfig(config);
    this.fileService
      .loadFile(this.entity, this.formControlName)
      .subscribe((res) => (this.imgPath = res));
  }
}
