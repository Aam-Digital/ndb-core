import { Component } from "@angular/core";
import { MatProgressBarModule } from "@angular/material/progress-bar";

@Component({
  templateUrl: "./application-loading.component.html",
  styleUrls: ["./application-loading.component.scss"],
  imports: [
    MatProgressBarModule
  ],
  standalone: true
})
export class ApplicationLoadingComponent {}
