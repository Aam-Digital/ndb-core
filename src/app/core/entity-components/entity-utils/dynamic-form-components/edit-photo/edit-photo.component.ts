import { Component } from "@angular/core";
import { DynamicComponent } from "../../../../view/dynamic-components/dynamic-component.decorator";
import { NgIf } from "@angular/common";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { EditFileComponent } from "../../../../../features/file/edit-file/edit-file.component";
import { SafeUrl } from "@angular/platform-browser";
import { FileService } from "../../../../../features/file/file.service";
import { AlertService } from "../../../../alerts/alert.service";
import { LoggingService } from "../../../../logging/logging.service";
import { EntityMapperService } from "../../../../entity/entity-mapper.service";
import { MatButtonModule } from "@angular/material/button";
import { resizeImage } from "../../../../../features/file/file-utils";

@DynamicComponent("EditPhoto")
@Component({
  selector: "app-edit-photo",
  templateUrl: "./edit-photo.component.html",
  styleUrls: ["./edit-photo.component.scss"],
  imports: [MatButtonModule, MatTooltipModule, FontAwesomeModule, NgIf],
  standalone: true,
})
export class EditPhotoComponent extends EditFileComponent {
  private readonly defaultImage = "assets/child.png";
  private readonly compression = 480;
  private initialImg: SafeUrl = this.defaultImage;
  imgPath: SafeUrl = this.initialImg;

  constructor(
    fileService: FileService,
    alertService: AlertService,
    logger: LoggingService,
    entityMapper: EntityMapperService
  ) {
    super(fileService, alertService, logger, entityMapper);
  }

  async onFileSelected(file: File): Promise<void> {
    const cvs = await resizeImage(file, this.compression);
    this.imgPath = cvs.toDataURL();
    const blob = await new Promise<Blob>((res) => cvs.toBlob(res));
    const reducedFile = new File([blob], file.name, {
      type: file.type,
      lastModified: file.lastModified,
    });
    return super.onFileSelected(reducedFile);
  }

  ngOnInit() {
    super.ngOnInit();
    if (this.entity[this.formControlName]) {
      this.fileService
        .loadFile(this.entity, this.formControlName)
        .subscribe((res) => {
          this.imgPath = res;
          this.initialImg = res;
        });
    }
  }

  delete() {
    this.resetPreview(this.defaultImage);
    super.delete();
  }

  protected resetFile() {
    this.resetPreview(this.initialImg);
    super.resetFile();
  }

  private resetPreview(resetImage: SafeUrl) {
    if (this.imgPath !== this.initialImg) {
      URL.revokeObjectURL(this.imgPath as string);
    }
    this.imgPath = resetImage;
  }

  protected deleteExistingFile() {
    URL.revokeObjectURL(this.initialImg as string);
    this.initialImg = this.defaultImage;
    super.deleteExistingFile();
  }
}
