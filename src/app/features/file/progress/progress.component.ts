import { Component, Inject } from "@angular/core";
import { MAT_LEGACY_SNACK_BAR_DATA as MAT_SNACK_BAR_DATA } from "@angular/material/legacy-snack-bar";
import { Observable } from "rxjs";

@Component({
  selector: "app-progress",
  templateUrl: "./progress.component.html",
})
export class ProgressComponent {
  constructor(
    @Inject(MAT_SNACK_BAR_DATA)
    public config: { message: string; progress: Observable<number> }
  ) {}
}
