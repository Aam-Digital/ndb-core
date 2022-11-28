import { Component, Inject } from "@angular/core";
import { MAT_SNACK_BAR_DATA } from "@angular/material/snack-bar";
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
