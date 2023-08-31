import {
  Component,
  HostBinding,
  Input,
  OnChanges,
  SimpleChanges,
} from "@angular/core";
import { getUrlWithoutParams } from "../../../utils/utils";
import { Router } from "@angular/router";
import { Location, NgIf } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";

@Component({
  selector: "app-view-title",
  templateUrl: "./view-title.component.html",
  styleUrls: ["./view-title.component.scss"],
  imports: [NgIf, MatButtonModule, MatTooltipModule, FontAwesomeModule],
  standalone: true,
})
export class ViewTitleComponent implements OnChanges {
  /** The page title to be displayed */
  @Input() title: string;

  /** (Optional) do not show button to navigate back to the parent page */
  @Input() disableBackButton: boolean = false;

  /**
   * whether instead of a basic back to previous page navigation the back button should navigate to logical parent page
   */
  navigateToParentBehaviour: boolean = false;

  readonly parentUrl: string;

  constructor(
    private router: Router,
    private location: Location,
  ) {
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

  ngOnChanges(changes: SimpleChanges) {
    if (changes.hasOwnProperty("disableBackButton")) {
      this.extraStyles = this.buildExtraStyles();
    }
  }

  private buildExtraStyles() {
    /* Moves the whole title component 12 pixels to the left so that
     * the "go back" button is aligned with the left border. This class
     * is applied conditionally when the "back" button is shown
     */
    return {
      position: "relative",
      left: "-12px",
    };
  }

  @HostBinding("class") extraClasses = "mat-title";
  @HostBinding("style") extraStyles = this.buildExtraStyles();
}
