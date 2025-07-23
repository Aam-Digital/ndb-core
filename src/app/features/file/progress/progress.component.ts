import { Component, inject } from "@angular/core";
import { MAT_SNACK_BAR_DATA } from "@angular/material/snack-bar";
import { Observable } from "rxjs";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { AsyncPipe } from "@angular/common";

@Component({
  selector: "app-progress",
  templateUrl: "./progress.component.html",
  imports: [MatProgressBarModule, AsyncPipe],
})
export class ProgressComponent {
  config = inject<{
    message: string;
    progress: Observable<number>;
  }>(MAT_SNACK_BAR_DATA);
}
