import {
  Component,
  inject,
  ChangeDetectionStrategy,
  input,
  resource,
} from "@angular/core";
import { firstValueFrom } from "rxjs";
import { map } from "rxjs/operators";
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

  imgSrc = resource({
    params: () => {
      const entity = this.entity();
      const imgProperty = this.imgProperty();
      const value = entity?.[imgProperty];
      if (!value) return undefined;
      return { entity: entity!, imgProperty, value };
    },
    loader: async ({ params: { entity, imgProperty, value } }) => {
      if (this.isRemoteUrl(value)) return value;
      // doesn't work with safeUrl
      return firstValueFrom(
        this.fileService
          .loadFile(entity, imgProperty)
          .pipe(map((res) => Object.values(res)[0] as string)),
      );
    },
  });

  private isRemoteUrl(value: string): boolean {
    return value.startsWith("https://");
  }
}
