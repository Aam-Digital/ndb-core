import { Component, inject, ChangeDetectionStrategy } from "@angular/core";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { Location } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { ActivatedRoute } from "@angular/router";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-submission-success",
  imports: [FaIconComponent, MatButtonModule],
  standalone: true,
  templateUrl: "./submission-success.component.html",
  styleUrls: ["./submission-success.component.scss"],
})
export class SubmissionSuccessComponent {
  private location = inject(Location);
  private readonly route = inject(ActivatedRoute);

  showSubmitAnotherButton = true;

  constructor() {
    const param = this.route.snapshot.queryParamMap.get(
      "showSubmitAnotherButton",
    );
    this.showSubmitAnotherButton = param !== "false";
  }

  submitAnotherForm() {
    this.location.back();
  }
}
