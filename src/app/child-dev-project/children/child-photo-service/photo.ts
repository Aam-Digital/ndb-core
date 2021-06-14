import { BehaviorSubject } from "rxjs";
import { SafeUrl } from "@angular/platform-browser";

/**
 * A simple interface for creating photo attributes.
 */
export interface Photo {
  /**
   * The path to the photo. This will be saved to the database.
   */
  path: string;

  /**
   * The actual photo which can be used in a template:
   * `<img [src]="photoObject.photo.value"/>`
   * This is not saved to the database but build from the `path` attribute when loaded from the database.
   */
  photo: BehaviorSubject<SafeUrl>;
}
