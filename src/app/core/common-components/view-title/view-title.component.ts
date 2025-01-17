import {
  AfterViewInit,
  Component,
  HostBinding,
  Input,
  Optional,
  TemplateRef,
  ViewChild,
} from "@angular/core";
import { getUrlWithoutParams } from "../../../utils/utils";
import { Router } from "@angular/router";
import { Location, NgIf, NgTemplateOutlet } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { ViewComponentContext } from "../../ui/abstract-view/abstract-view.component";

/**
 * Building block for views, providing a consistent layout to a title section
 * for both dialog and routed views.
 */
@Component({
  selector: "app-view-title",
  templateUrl: "./view-title.component.html",
  styleUrls: ["./view-title.component.scss"],
  imports: [
    NgIf,
    MatButtonModule,
    MatTooltipModule,
    FontAwesomeModule,
    NgTemplateOutlet,
  ],
})
export class ViewTitleComponent implements AfterViewInit {
  @ViewChild("template") template: TemplateRef<any>;

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
    @Optional() protected viewContext: ViewComponentContext,
  ) {
    this.parentUrl = this.findParentUrl();

    if (this.viewContext?.isDialog) {
      this.disableBackButton = true;
    }
  }

  ngAfterViewInit(): void {
    if (this.viewContext && !this.displayInPlace) {
      setTimeout(() => (this.viewContext.title = this));
    }
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

  @HostBinding("class") extraClasses = "mat-title";
  @Input() displayInPlace!: boolean;
}
