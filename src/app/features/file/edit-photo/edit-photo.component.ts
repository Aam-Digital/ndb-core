import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatDialog } from "@angular/material/dialog";
import { MatTooltipModule } from "@angular/material/tooltip";
import { SafeUrl } from "@angular/platform-browser";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { DynamicComponent } from "../../../core/config/dynamic-components/dynamic-component.decorator";
import { EditFileComponent } from "../edit-file/edit-file.component";
import { resizeImage } from "../file-utils";
import { ImagePopupComponent } from "./image-popup/image-popup.component";

@DynamicComponent("EditPhoto")
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-edit-photo",
  templateUrl: "./edit-photo.component.html",
  styleUrls: ["./edit-photo.component.scss"],
  imports: [MatButtonModule, MatTooltipModule, FontAwesomeModule],
})
export class EditPhotoComponent extends EditFileComponent implements OnInit {
  private dialog = inject(MatDialog);

  private readonly defaultImage = "assets/child.png";
  private compression = 480;
  private initialImg: SafeUrl = this.defaultImage;
  readonly imgPath = signal<SafeUrl>(this.defaultImage);

  override async onFileSelected(file: File): Promise<void> {
    const cvs = await resizeImage(file, this.compression);
    this.imgPath.set(cvs.toDataURL());
    const blob = await new Promise<Blob>((res) => cvs.toBlob(res));
    const reducedFile = new File([blob], file.name, {
      type: file.type,
      lastModified: file.lastModified,
    });
    return super.onFileSelected(reducedFile);
  }

  override ngOnInit() {
    this.acceptedFileTypes = "image/*";
    this.compression =
      this.formFieldConfig()?.additional?.imageCompression ?? this.compression;
    super.ngOnInit();
    const entity = this.entity();
    const formFieldConfig = this.formFieldConfig();
    if (this.formControl.value && entity && formFieldConfig) {
      this.fileService.loadFile(entity, formFieldConfig.id).subscribe((res) => {
        this.imgPath.set(res);
        this.initialImg = res;
      });
    }
  }

  override delete() {
    this.resetPreview(this.defaultImage);
    super.delete();
  }

  protected override resetFile() {
    this.resetPreview(this.initialImg);
    super.resetFile();
  }

  private resetPreview(resetImage: SafeUrl) {
    if (this.imgPath() !== this.initialImg) {
      URL.revokeObjectURL(this.imgPath() as string);
    }
    this.imgPath.set(resetImage);
  }

  protected override deleteExistingFile() {
    URL.revokeObjectURL(this.initialImg as string);
    this.initialImg = this.defaultImage;
    super.deleteExistingFile();
  }

  openPopup() {
    this.dialog.open(ImagePopupComponent, { data: { url: this.imgPath() } });
  }
}
