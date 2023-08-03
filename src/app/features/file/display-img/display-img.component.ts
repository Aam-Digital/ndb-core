import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { Entity } from "../../../core/entity/model/entity";
import { FaDynamicIconComponent } from "../../../core/view/fa-dynamic-icon/fa-dynamic-icon.component";
import { NgIf } from "@angular/common";
import { FileService } from "../file.service";

@Component({
  selector: "app-display-img",
  templateUrl: "./display-img.component.html",
  styleUrls: ["./display-img.component.scss"],
  standalone: true,
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
    if (changes.entity || changes.imgProperty) {
      delete this.imgSrc;
      this.fileService
        .loadFile(this.entity, this.imgProperty)
        .subscribe((res) => {
          // doesn't work with safeUrl
          this.imgSrc = Object.values(res)[0];
        });
    }
  }
}
