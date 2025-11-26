import { Component } from "@angular/core";
import { ViewTitleComponent } from "../../common-components/view-title/view-title.component";
import { HintBoxComponent } from "#src/app/core/common-components/hint-box/hint-box.component";

@Component({
  selector: "app-subscription-info",
  imports: [ViewTitleComponent, HintBoxComponent],
  templateUrl: "./subscription-info.component.html",
  styleUrl: "./subscription-info.component.scss",
})
export class SubscriptionInfoComponent {}
