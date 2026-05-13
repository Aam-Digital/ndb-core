import {
  Component,
  inject,
  ChangeDetectionStrategy,
  effect,
  input,
  signal,
} from "@angular/core";
import { Entity } from "../../../core/entity/model/entity";
import { FileService } from "../file.service";
import { FaDynamicIconComponent } from "../../../core/common-components/fa-dynamic-icon/fa-dynamic-icon.component";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-display-img",
  templateUrl: "./display-img.component.html",
  styleUrls: ["./display-img.component.scss"],
  imports: [FaDynamicIconComponent],
})
export class DisplayImgComponent {
  private fileService = inject(FileService);

  defaultImage = input<string>();
  defaultIcon = input<string>();
  entity = input<Entity>();
  imgProperty = input<string>();
  imgSrc = signal<string | undefined>(undefined);

  constructor() {
    effect((onCleanup) => {
      const entity = this.entity();
      const imgProperty = this.imgProperty();
      this.imgSrc.set(undefined);
      if (!entity || !imgProperty) {
        return;
      }

      const value = entity[imgProperty];
      if (!value) {
        return;
      }

      if (this.isRemoteUrl(value)) {
        this.imgSrc.set(value);
        return;
      }

      const sub = this.fileService
        .loadFile(entity, imgProperty)
        .subscribe((res) => {
          // doesn't work with safeUrl
          this.imgSrc.set(Object.values(res)[0] as string);
        });
      onCleanup(() => sub.unsubscribe());
    });
  }

  private isRemoteUrl(value: string): boolean {
    return value.startsWith("https://");
  }
}
