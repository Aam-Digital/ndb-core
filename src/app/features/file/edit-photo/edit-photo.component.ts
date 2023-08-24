import { Component, OnInit } from "@angular/core";
import { DynamicComponent } from "../../../core/config/dynamic-components/dynamic-component.decorator";
import { NgIf } from "@angular/common";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { EditFileComponent } from "../edit-file/edit-file.component";
import { SafeUrl } from "@angular/platform-browser";
import { FileService } from "../file.service";
import { AlertService } from "../../../core/alerts/alert.service";
import { LoggingService } from "../../../core/logging/logging.service";
import { EntityMapperService } from "../../../core/entity/entity-mapper/entity-mapper.service";
import { MatButtonModule } from "@angular/material/button";
import { resizeImage } from "../file-utils";
import { MatDialog } from "@angular/material/dialog";
import { ImagePopupComponent } from "./image-popup/image-popup.component";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { ReactiveFormsModule } from "@angular/forms";
import { ErrorHintComponent } from "../../../core/common-components/error-hint/error-hint.component";

@DynamicComponent("EditPhoto")
@Component({
  selector: "app-edit-photo",
  templateUrl: "./edit-photo.component.html",
  styleUrls: ["./edit-photo.component.scss"],
  imports: [
    MatButtonModule,
    MatTooltipModule,
    FontAwesomeModule,
    NgIf,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    EditFileComponent,
    ErrorHintComponent,
  ],
  standalone: true,
})
export class EditPhotoComponent extends EditFileComponent implements OnInit {
  private readonly defaultImage = "assets/child.png";
  private readonly compression = 480;
  private initialImg: SafeUrl = this.defaultImage;
  imgPath: SafeUrl = this.initialImg;

  constructor(
    fileService: FileService,
    alertService: AlertService,
    logger: LoggingService,
    entityMapper: EntityMapperService,
    private dialog: MatDialog,
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
    if (this.formControl.value) {
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

  openPopup() {
    this.dialog.open(ImagePopupComponent, { data: { url: this.imgPath } });
  }
}
