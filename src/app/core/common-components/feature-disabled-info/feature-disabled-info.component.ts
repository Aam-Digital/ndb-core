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

  /**
   * The name of the feature that is disabled (e.g., "Export API", "Notifications")
   */
  @Input() featureName?: string;
}
