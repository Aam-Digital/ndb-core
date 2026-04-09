import { Component, ChangeDetectionStrategy } from "@angular/core";
import { ViewTitleComponent } from "../../common-components/view-title/view-title.component";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-data-privacy",
  imports: [ViewTitleComponent],
  templateUrl: "./data-privacy.component.html",
  styleUrl: "./data-privacy.component.scss",
})
export class DataPrivacyComponent {}
