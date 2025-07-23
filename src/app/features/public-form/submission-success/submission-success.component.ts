import { Component, inject } from "@angular/core";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { Location } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";

@Component({
  selector: "app-submission-success",
  imports: [FaIconComponent, MatButtonModule],
  standalone: true,
  templateUrl: "./submission-success.component.html",
  styleUrls: ["./submission-success.component.scss"],
})
export class SubmissionSuccessComponent {
  private location = inject(Location);

  submitAnotherForm() {
    this.location.back();
  }
}
