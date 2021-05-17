import { BehaviorSubject } from "rxjs";
import { SafeUrl } from "@angular/platform-browser";

export interface Photo {
  path: string;
  photo: BehaviorSubject<SafeUrl>;
}
