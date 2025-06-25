import { Component, Input, OnChanges, SimpleChanges, inject } from "@angular/core";
import { Entity } from "../../../core/entity/model/entity";
import { FileService } from "../file.service";
import { FaDynamicIconComponent } from "../../../core/common-components/fa-dynamic-icon/fa-dynamic-icon.component";

@Component({
  selector: "app-display-img",
  templateUrl: "./display-img.component.html",
  styleUrls: ["./display-img.component.scss"],
  imports: [FaDynamicIconComponent],
})
export class DisplayImgComponent implements OnChanges {
  private fileService = inject(FileService);

  @Input() defaultImage: string;
  @Input() defaultIcon: string;
  @Input() entity: Entity;
  @Input() imgProperty: string;
  imgSrc: string;

  ngOnChanges(changes: SimpleChanges) {
    if (
      changes.hasOwnProperty("entity") ||
      changes.hasOwnProperty("property")
    ) {
      delete this.imgSrc;
      if (this.entity[this.imgProperty]) {
        this.fileService
          .loadFile(this.entity, this.imgProperty)
          .subscribe((res) => {
            // doesn't work with safeUrl
            this.imgSrc = Object.values(res)[0];
          });
      }
    }
  }
}
