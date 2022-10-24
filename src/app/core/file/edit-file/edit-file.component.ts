import { Component } from "@angular/core";
import { EditComponent } from "../../entity-components/entity-utils/dynamic-form-components/edit-component";
import { DynamicComponent } from "../../view/dynamic-components/dynamic-component.decorator";
import { FileService } from "../file.service";

@DynamicComponent("edit-file")
@Component({
  selector: "app-edit-file",
  templateUrl: "./edit-file.component.html",
  styleUrls: ["./edit-file.component.scss"],
})
export class EditFileComponent extends EditComponent<string> {
  constructor(private fileService: FileService) {
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
      .uploadFile(
        file,
        `Child:6f7c5204-6216-4e8a-81ab-c67db2899fd0`,
        this.formControlName
      )
      .subscribe({
        next: (res) => console.log("res", res),
        error: (err) => console.log("err", err),
      });
  }

  fileClicked() {
    this.fileService.showFile(
      "Child:6f7c5204-6216-4e8a-81ab-c67db2899fd0",
      this.formControlName
    );
  }
}
