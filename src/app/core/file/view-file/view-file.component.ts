import { Component } from "@angular/core";
import { ViewDirective } from "../../entity-components/entity-utils/view-components/view.directive";
import { FileService } from "../file.service";
import { DynamicComponent } from "../../view/dynamic-components/dynamic-component.decorator";

@DynamicComponent("ViewFile")
@Component({
  selector: "app-view-file",
  templateUrl: "./view-file.component.html",
  styleUrls: ["./view-file.component.scss"],
})
export class ViewFileComponent extends ViewDirective<string> {
  constructor(public fileService: FileService) {
    super();
  }

  showFile(event: Event) {
    // Prevent bubbling
    event.stopPropagation();
    this.fileService.showFile(this.entity, this.property);
  }
}
