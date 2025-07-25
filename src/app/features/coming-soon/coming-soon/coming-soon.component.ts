import { Component, Input, OnInit, inject } from "@angular/core";
import { AlertService } from "../../../core/alerts/alert.service";
import { ActivatedRoute } from "@angular/router";
import { AnalyticsService } from "../../../core/analytics/analytics.service";
import { MAT_DIALOG_DATA, MatDialogModule } from "@angular/material/dialog";
import { DialogCloseComponent } from "../../../core/common-components/dialog-close/dialog-close.component";
import { MatButtonModule } from "@angular/material/button";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";

import { RouteTarget } from "../../../route-target";

/**
 * Placeholder page to announce that a feature is not available yet.
 *
 * This integrates with analytics and allows user to explicitly request the feature.
 */
@RouteTarget("ComingSoon")
@Component({
  selector: "app-coming-soon",
  templateUrl: "./coming-soon.component.html",
  styleUrls: ["./coming-soon.component.scss"],
  imports: [
    DialogCloseComponent,
    MatDialogModule,
    MatButtonModule,
    FontAwesomeModule,
  ],
})
export class ComingSoonComponent implements OnInit {
  private alertService = inject(AlertService);
  private analyticsService = inject(AnalyticsService);
  private activatedRoute = inject(ActivatedRoute);

  /**
   * An array of featureIds that the user has already requested during the current session.
   *
   * Users cannot request the same feature twice and see that they have already requested the feature.
   * This information is not persisted across sessions however. So after reloading the page this history is gone.
   */
  static featuresRequested = [];

  /**
   * the identifier for the specific feature this page serves as a placeholder for
   */
  @Input() featureId: string;

  /**
   * whether user has already requested the feature
   */
  requested: boolean;

  constructor() {
    const dialogData = inject<{
      featureId: string;
    }>(MAT_DIALOG_DATA, { optional: true });

    if (dialogData) {
      this.init(dialogData.featureId);
    }
    this.activatedRoute.paramMap.subscribe((params) => {
      if (params.has("feature")) {
        this.init(params.get("feature"));
      }
    });
  }

  ngOnInit(): void {
    if (this.featureId) {
      this.init(this.featureId);
    }
  }

  private init(newFeatureId: string) {
    this.featureId = newFeatureId;
    this.requested =
      ComingSoonComponent.featuresRequested.includes(newFeatureId);

    this.track("visit");
  }

  private track(action: string) {
    this.analyticsService.eventTrack(this.featureId, {
      category: "feature_request",
      label: action,
    });
  }

  /**
   * Report an explicit user request for the feature through the analytics plugin.
   */
  reportFeatureRequest() {
    this.track("request");

    this.requested = true;
    ComingSoonComponent.featuresRequested.push(this.featureId);
    this.alertService.addInfo(
      $localize`:Sent after the user has sent a feature-request:Thank you for letting us know.`,
    );
  }
}
