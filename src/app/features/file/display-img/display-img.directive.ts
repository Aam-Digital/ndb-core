import { Directive, ElementRef, Input, OnChanges } from "@angular/core";
import { Entity } from "../../../core/entity/model/entity";
import { FileService } from "../file.service";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";

@Directive({
  selector: "[appDisplayImg]",
  standalone: true,
})
export class DisplayImgDirective implements OnChanges {
  @Input() appDisplayImg: Entity;
  @Input() imgProperty: string;
  @Input() defaultImage: string = "assets/child.png";
  @Input() defaultIcon: string = "child";

  private imgEl: HTMLImageElement;
  private iconEl: FaIconComponent;

  constructor(
    private el: ElementRef<HTMLElement>,
    private fileService: FileService,
  ) {}

  ngOnChanges() {
    this.hideImg();
    if (this.appDisplayImg?.[this.imgProperty]) {
      this.fileService
        .loadFile(this.appDisplayImg, this.imgProperty)
        .subscribe((res) => {
          // doesn't work with safeUrl
          this.showImg(Object.values(res)[0]);
        });
    } else if (this.defaultImage) {
      this.showImg(this.defaultImage);
    } else if (this.defaultIcon) {
    }
  }

  showImg(src: string) {
    if (!this.imgEl) {
      this.imgEl = document.createElement("img");
      this.imgEl.style.setProperty("all", "inherit");
      this.el.nativeElement.appendChild(this.imgEl);
    }
    this.imgEl.src = src;
    this.imgEl.style.display = "";
  }
  hideImg() {
    if (this.imgEl) {
      this.imgEl.style.display = "none";
    }
  }
}
