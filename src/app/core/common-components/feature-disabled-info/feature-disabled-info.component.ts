import { NAVIGATOR_TOKEN } from "#src/app/utils/di-tokens";
import { Component, inject, Input } from "@angular/core";
import { MatProgressBar } from "@angular/material/progress-bar";

/**
 * Component that displays information when a feature is disabled or loading.
 * Handles three states: loading (undefined), disabled (false), and enabled (true - shows nothing).
 */
@Component({
  selector: "app-feature-disabled-info",
  templateUrl: "./feature-disabled-info.component.html",
  styleUrl: "./feature-disabled-info.component.scss",
  imports: [MatProgressBar],
})
export class FeatureDisabledInfoComponent {
  protected readonly navigator: Navigator = inject(NAVIGATOR_TOKEN);

  private _featureName?: string;

  /**
   * The name of the feature that is disabled (e.g., "Export API", "Notifications")
   */
  @Input()
  set featureName(value: string) {
    this._featureName = value;
  }
  get featureName(): string {
    return this._featureName || "this feature";
  }

  /**
   * Whether to show the loading indicator
   */
  @Input() showLoader: boolean;

  /**
   * Whether to use a compact view (less text)
   */
  @Input() compactView: boolean = false;
}
