import { Component } from "@angular/core";
import { MatTooltip } from "@angular/material/tooltip";
import { MatCard } from "@angular/material/card";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";

/**
 * Simple banner to mark a feature as "beta" and inform users of possibly limited functionality.
 */
@Component({
  selector: "app-beta-feature",
  standalone: true,
  imports: [MatTooltip, MatCard, FaIconComponent],
  templateUrl: "./beta-feature.component.html",
  styleUrl: "./beta-feature.component.scss",
})
export class BetaFeatureComponent {}
