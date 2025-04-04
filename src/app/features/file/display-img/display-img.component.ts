import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { Entity } from "../../../core/entity/model/entity";
import { NgIf } from "@angular/common";
import { FileService } from "../file.service";
import { FaDynamicIconComponent } from "../../../core/common-components/fa-dynamic-icon/fa-dynamic-icon.component";

@Component({
  selector: "app-display-img",
  templateUrl: "./display-img.component.html",
  styleUrls: ["./display-img.component.scss"],
  imports: [FaDynamicIconComponent, NgIf],
})
export class DisplayImgComponent implements OnChanges {
  @Input() defaultImage: string;
  @Input() defaultIcon: string;
  @Input() entity: Entity;
  @Input() imgProperty: string;
  imgSrc: string;

  constructor(private fileService: FileService) {}

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
