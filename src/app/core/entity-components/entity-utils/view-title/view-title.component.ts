import { Component, Input } from "@angular/core";
import { getUrlWithoutParams } from "../../../../utils/utils";
import { Router } from "@angular/router";
import { Location } from "@angular/common";

@Component({
  selector: "app-view-title",
  templateUrl: "./view-title.component.html",
})
export class ViewTitleComponent {
  /** The page title to be displayed */
  @Input() title: string;

  /** (Optional) do not show button to navigate back to the parent page */
  @Input() disableBackButton: boolean = false;

  /**
   * whether instead of a basic back to previous page navigation the back button should navigate to logical parent page
   */
  navigateToParentBehaviour: boolean = false;

  readonly parentUrl: string;

  constructor(private router: Router, private location: Location) {
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

  async navigateBack() {
    if (this.navigateToParentBehaviour && this.parentUrl) {
      await this.router.navigate([this.parentUrl]);
    } else {
      this.location.back();
    }
  }
}
