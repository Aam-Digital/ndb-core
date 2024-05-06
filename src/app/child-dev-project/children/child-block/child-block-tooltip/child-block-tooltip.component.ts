import { Component, Input, OnInit } from "@angular/core";
import { Child } from "../../model/child";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { NgForOf, NgIf } from "@angular/common";
import { FaDynamicIconComponent } from "../../../../core/common-components/fa-dynamic-icon/fa-dynamic-icon.component";
import { SafeUrl } from "@angular/platform-browser";
import { FileService } from "../../../../features/file/file.service";
import { EntityBlockComponent } from "../../../../core/basic-datatypes/entity/entity-block/entity-block.component";

/**
 * Tooltip that is shown when hovering over a child block and the tooltip is enabled.
 */
@Component({
  selector: "app-child-block-tooltip",
  templateUrl: "./child-block-tooltip.component.html",
  styleUrls: ["./child-block-tooltip.component.scss"],
  imports: [
    FontAwesomeModule,
    NgIf,
    NgForOf,
    FaDynamicIconComponent,
    EntityBlockComponent,
  ],
  standalone: true,
})
export class ChildBlockTooltipComponent implements OnInit {
  /** The entity to show the tooltip for */
  @Input() entity: Child;
  icon = Child.icon;
  imgPath: SafeUrl;

  constructor(private fileService: FileService) {}

  ngOnInit() {
    if (this.entity.photo) {
      this.fileService
        .loadFile(this.entity, "photo")
        .subscribe((res) => (this.imgPath = res));
    }
  }
}
