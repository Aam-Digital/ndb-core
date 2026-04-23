import { Component, ChangeDetectionStrategy } from "@angular/core";
import { MatProgressBarModule } from "@angular/material/progress-bar";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-application-loading",
  templateUrl: "./application-loading.component.html",
  styleUrls: ["./application-loading.component.scss"],
  imports: [MatProgressBarModule],
})
export class ApplicationLoadingComponent {}
