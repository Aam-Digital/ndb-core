import { NAVIGATOR_TOKEN } from "#src/app/utils/di-tokens";
import { Component, inject, Input } from "@angular/core";

/**
 * component that displays information when a feature is disabled.
 */
@Component({
  selector: "app-feature-disabled-info",
  templateUrl: "./feature-disabled-info.component.html",
  styleUrl: "./feature-disabled-info.component.scss",
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
}
