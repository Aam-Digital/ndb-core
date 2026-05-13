import {
  Component,
  effect,
  input,
  signal,
  inject,
  ChangeDetectionStrategy,
} from "@angular/core";
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
  changeDetection: ChangeDetectionStrategy.OnPush,
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
export class ComingSoonComponent {
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
  featureId = input<string>();
  private currentFeatureId = signal<string | undefined>(undefined);

  /**
   * whether user has already requested the feature
   */
  requested = signal(false);

  constructor() {
    const dialogData = inject<{
      featureId: string;
    }>(MAT_DIALOG_DATA, { optional: true });

    if (dialogData?.featureId) {
      this.init(dialogData.featureId);
    }
    this.activatedRoute.paramMap.subscribe((params) => {
      if (params.has("feature")) {
        this.init(params.get("feature") ?? undefined);
      }
    });

    effect(() => {
      this.init(this.featureId());
    });
  }

  private init(newFeatureId: string | undefined) {
    if (!newFeatureId) {
      return;
    }
    this.currentFeatureId.set(newFeatureId);
    this.requested.set(
      ComingSoonComponent.featuresRequested.includes(newFeatureId),
    );

    this.track("visit");
  }

  private track(action: string) {
    const featureId = this.currentFeatureId();
    if (!featureId) {
      return;
    }
    this.analyticsService.eventTrack(featureId, {
      category: "feature_request",
      label: action,
    });
  }

  /**
   * Report an explicit user request for the feature through the analytics plugin.
   */
  reportFeatureRequest() {
    const featureId = this.currentFeatureId();
    if (!featureId) {
      return;
    }
    this.track("request");

    this.requested.set(true);
    ComingSoonComponent.featuresRequested.push(featureId);
    this.alertService.addInfo(
      $localize`:Sent after the user has sent a feature-request:Thank you for letting us know.`,
    );
  }
}
