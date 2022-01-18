import { Component, Input } from "@angular/core";
import { getUrlWithoutParams } from "../../../../utils/utils";
import { Router } from "@angular/router";

@Component({
  selector: "app-view-title",
  templateUrl: "./view-title.component.html",
  styleUrls: ["./view-title.component.scss"],
})
export class ViewTitleComponent {
  /** The page title to be displayed */
  @Input() title: string;

  /** (Optional) do not show button to navigate back to the parent page */
  @Input() disableBackButton: boolean = false;

  readonly parentUrl: string;

  constructor(private router: Router) {
    this.parentUrl = this.findParentUrl();
  }

  private findParentUrl(): string {
    const currentUrl = getUrlWithoutParams(this.router);
    const lastUrlSegmentStart = currentUrl.lastIndexOf("/");
    if (lastUrlSegmentStart < 1) {
      // do not navigate to root
      return null;
    }

    return currentUrl.substring(0, lastUrlSegmentStart);
  }

  async navigateToParent() {
    if (!this.parentUrl) {
      return;
    }

    await this.router.navigate([this.parentUrl]);
  }
}
