import { Component, Inject } from "@angular/core";
import { MAT_SNACK_BAR_DATA } from "@angular/material/snack-bar";
import { Observable } from "rxjs";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { AsyncPipe } from "@angular/common";

@Component({
  selector: "app-progress",
  templateUrl: "./progress.component.html",
  imports: [MatProgressBarModule, AsyncPipe],
  standalone: true,
})
export class ProgressComponent {
  constructor(
    @Inject(MAT_SNACK_BAR_DATA)
    public config: { message: string; progress: Observable<number> },
  ) {}
}
