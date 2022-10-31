import { Component } from "@angular/core";
import { EditComponent } from "../../entity-components/entity-utils/dynamic-form-components/edit-component";
import { DynamicComponent } from "../../view/dynamic-components/dynamic-component.decorator";
import { FileService } from "../file.service";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import { HttpEventType } from "@angular/common/http";

@DynamicComponent("edit-file")
@Component({
  selector: "app-edit-file",
  templateUrl: "./edit-file.component.html",
  styleUrls: ["./edit-file.component.scss"],
})
export class EditFileComponent extends EditComponent<string> {
  uploadProgress: number;

  constructor(
    private fileService: FileService,
    private entityMapper: EntityMapperService
  ) {
    super();
  }

  onFileSelected(event) {
    // How to store information whether a file has already been selected on the entity?
    // At the moment we cannot make sure, that a user saves after selecting a file.
    // If we upload in the SchemaService/Datatype we would upload every time the entity is changed -> too often
    // Here we cannot really listen for the save/cancel button
    const file: File = event.target.files[0];
    this.formControl.setValue(file.name);
    this.fileService
      .uploadFile(file, this.entity._id, this.formControlName)
      .subscribe({
        next: (event) => {
          if (event.type == HttpEventType.UploadProgress) {
            this.uploadProgress = Math.round(
              100 * (event.loaded / event.total)
            );
          }
        },
        error: (err) => console.log("err", err),
        complete: () => {
          this.entity[this.formControlName] = file.name;
          this.entityMapper
            .save(this.entity)
            .then(() => console.log("entity", this.entity));
        },
      });
  }

  fileClicked() {
    this.fileService.showFile(this.entity._id, this.formControlName);
  }
}
