import { Component } from "@angular/core";
import { EditPropertyConfig } from "../edit-component";
import { DomSanitizer, SafeUrl } from "@angular/platform-browser";
import { EditFileComponent } from "../../../../../features/file/edit-file/edit-file.component";
import { NgIf } from "@angular/common";
import { FileService } from "../../../../../features/file/file.service";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { AlertService } from "../../../../alerts/alert.service";
import { LoggingService } from "../../../../logging/logging.service";
import { EntityMapperService } from "../../../../entity/entity-mapper.service";

@Component({
  selector: "app-new-photo",
  standalone: true,
  imports: [
    EditFileComponent,
    NgIf,
    MatButtonModule,
    MatTooltipModule,
    FontAwesomeModule,
  ],
  templateUrl: "./new-photo.component.html",
  styleUrls: ["./new-photo.component.scss"],
})
export class NewPhotoComponent extends EditFileComponent {
  private readonly defaultImage = "assets/child.png";
  private initialImg: SafeUrl = this.defaultImage;
  imgPath: SafeUrl = this.initialImg;
  compressImage = 480;

  constructor(
    fileService: FileService,
    alertService: AlertService,
    logger: LoggingService,
    entityMapper: EntityMapperService,
    private sanitizer: DomSanitizer
  ) {
    super(fileService, alertService, logger, entityMapper);
  }

  async onFileSelected(event): Promise<void> {
    this.imgPath = this.sanitizer.bypassSecurityTrustUrl(
      URL.createObjectURL(event.target.files[0])
    );
    return super.onFileSelected(event);
  }

  onInitFromDynamicConfig(config: EditPropertyConfig<string>) {
    super.onInitFromDynamicConfig(config);
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
