import { Component } from "@angular/core";
import { EditComponent, EditPropertyConfig } from "../edit-component";
import { DomSanitizer, SafeUrl } from "@angular/platform-browser";
import { EditFileComponent } from "../../../../../features/file/edit-file/edit-file.component";
import { NgIf } from "@angular/common";
import { FileService } from "../../../../../features/file/file.service";

@Component({
  selector: "app-new-photo",
  standalone: true,
  imports: [EditFileComponent, NgIf],
  templateUrl: "./new-photo.component.html",
  styleUrls: ["./new-photo.component.scss"],
})
export class NewPhotoComponent extends EditComponent<string> {
  imgPath: SafeUrl = "assets/child.png";

  constructor(
    private fileService: FileService,
    private sanitizer: DomSanitizer
  ) {
    super();
  }

  onInitFromDynamicConfig(config: EditPropertyConfig<string>) {
    super.onInitFromDynamicConfig(config);
    if (this.entity[this.formControlName]) {
      this.fileService
        .loadFile(this.entity, this.formControlName)
        .subscribe((res) => (this.imgPath = res));
    }
  }

  updateFile(file: File) {
    this.imgPath = this.sanitizer.bypassSecurityTrustUrl(
      URL.createObjectURL(file)
    );
  }
}
