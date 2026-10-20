import {
  Component,
  inject,
  ChangeDetectionStrategy,
  computed,
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

  /**
   * Show a hint if the field references a file that could not be loaded (usually: it is missing).
   * Only enable this for users who can upload the file again.
   */
  showMissingFileHint = input<boolean>(false);

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

  /** whether the field references a file, but loading it failed (e.g. the file is missing) */
  readonly fileMissing = computed(
    () =>
      !!this.entity()?.[this.imgProperty()] &&
      this.imgSrc.status() === "resolved" &&
      !this.imgSrc.value(),
  );
}
