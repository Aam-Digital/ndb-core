import { Directive, ElementRef, Input, OnChanges } from "@angular/core";
import { Entity } from "../../../core/entity/model/entity";
import { FileService } from "../file.service";

@Directive({
  selector: "[appDisplayImg]",
  standalone: true,
})
export class DisplayImgDirective implements OnChanges {
  @Input() appDisplayImg: Entity;
  @Input() imgProperty: string;
  @Input() defaultImage: string;

  constructor(
    private el: ElementRef<HTMLImageElement>,
    private fileService: FileService,
  ) {}

  ngOnChanges() {
    delete this.el.nativeElement.src;
    this.hide();
    if (this.appDisplayImg?.[this.imgProperty]) {
      this.fileService
        .loadFile(this.appDisplayImg, this.imgProperty)
        .subscribe((res) => {
          // doesn't work with safeUrl
          this.el.nativeElement.src = Object.values(res)[0];
          this.show();
        });
    } else if (this.defaultImage) {
      this.el.nativeElement.src = this.defaultImage;
      this.show();
    }
  }

  show() {
    this.el.nativeElement.style.display = "";
  }
  hide() {
    this.el.nativeElement.style.display = "none";
  }
}
