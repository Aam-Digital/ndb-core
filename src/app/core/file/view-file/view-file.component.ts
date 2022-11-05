import { Component } from "@angular/core";
import { ViewDirective } from "../../entity-components/entity-utils/view-components/view.directive";
import { DynamicComponent } from "../../view/dynamic-components/dynamic-component.decorator";
import { FileService } from "../file.service";

/**
 * This component should be used as `viewComponent` when a property stores files.
 * If a file is stored, this component allows to view it.
 */
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
    // Prevent event bubbling
    event.stopPropagation();
    this.fileService.showFile(this.entity, this.property);
  }
}
