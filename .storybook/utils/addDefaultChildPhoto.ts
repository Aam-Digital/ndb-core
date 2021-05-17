import { Child } from "../../src/app/child-dev-project/children/model/child";
import { BehaviorSubject } from "rxjs";
import { SafeUrl } from "@angular/platform-browser";

export function addDefaultChildPhoto(child: Child) {
  child.photo.photo = new BehaviorSubject<SafeUrl>("assets/child.png");
}
