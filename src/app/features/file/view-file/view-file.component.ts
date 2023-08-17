import { Component } from "@angular/core";
import { ViewDirective } from "../../../core/entity-components/entity-properties/view/view.directive";
import { DynamicComponent } from "../../../core/view/dynamic-components/dynamic-component.decorator";
import { FileService } from "../file.service";
import { MatButtonModule } from "@angular/material/button";
import { NgIf } from "@angular/common";

/**
 * This component should be used as `viewComponent` when a property stores files.
 * If a file is stored, this component allows to view it.
 */
@DynamicComponent("ViewFile")
@Component({
  selector: "app-view-file",
  templateUrl: "./view-file.component.html",
  styleUrls: ["../edit-file/edit-file.component.scss"],
  imports: [MatButtonModule, NgIf],
  standalone: true,
})
export class ViewFileComponent extends ViewDirective<string> {
  constructor(public fileService: FileService) {
    super();
  }

  showFile(event: Event) {
    // Prevent event bubbling
    event.stopPropagation();
    this.fileService.showFile(this.entity, this.id);
  }
}
