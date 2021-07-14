import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { AlertService } from "../../alerts/alert.service";
import { ActivatedRoute } from "@angular/router";
import { AnalyticsService } from "../../analytics/analytics.service";

/**
 * Placeholder page to announce that a feature is not available yet.
 *
 * This integrates with analytics and allows user to explicitly request the feature.
 */
@Component({
  selector: "app-coming-soon",
  templateUrl: "./coming-soon.component.html",
  styleUrls: ["./coming-soon.component.scss"],
})
export class ComingSoonComponent implements OnChanges {
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

  constructor(
    private alertService: AlertService,
    private analyticsService: AnalyticsService,
    private activatedRoute: ActivatedRoute
  ) {
    this.activatedRoute.paramMap.subscribe((params) => {
      if (params.has("feature")) {
        this.init(params.get("feature"));
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.hasOwnProperty("featureId")) {
      this.init(changes.featureId.currentValue);
    }
  }

  private init(newFeatureId: string) {
    this.featureId = newFeatureId;
    this.requested =
      ComingSoonComponent.featuresRequested.includes(newFeatureId);

    this.track("visit");
  }

  private track(action: string) {
    this.analyticsService.eventTrack(action, {
      category: "feature_request",
      label: this.featureId,
    });
  }

  /**
   * Report an explicit user request for the feature through the analytics plugin.
   */
  reportFeatureRequest() {
    this.track("request");

    this.requested = true;
    ComingSoonComponent.featuresRequested.push(this.featureId);
    this.alertService.addInfo("Thank you for letting us know.");
  }
}
