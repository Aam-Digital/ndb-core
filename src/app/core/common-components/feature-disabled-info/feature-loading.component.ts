import { Component } from "@angular/core";
import { MatProgressBar } from "@angular/material/progress-bar";

/**
 * Small inline component for feature loading state.
 */
@Component({
  selector: "app-feature-loading",
  template: `
    <div class="margin-top-large feature-loading-box">
      <mat-progress-bar
        mode="indeterminate"
        style="margin-bottom: 1rem"
      ></mat-progress-bar>
      <p i18n>
        Checking if this feature is enabled for your system. This may take a few
        seconds...
      </p>
    </div>
  `,
  imports: [MatProgressBar],
})
export class FeatureLoadingComponent {}
