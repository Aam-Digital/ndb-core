import { Component, Input, OnInit, Optional } from "@angular/core";
import { Router } from "@angular/router";
import { ChildrenService } from "../children.service";
import { Child } from "../model/child";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";

@UntilDestroy()
@Component({
  selector: "app-child-block",
  templateUrl: "./child-block.component.html",
  styleUrls: ["./child-block.component.scss"],
})
export class ChildBlockComponent implements OnInit {
  @Input() entity: Child;
  @Input() entityId: string;

  /** prevent clicks on the component to navigate to the details page */
  @Input() linkDisabled: boolean;

  /** prevent additional details to be displayed in a tooltip on mouse over */
  @Input() tooltipDisabled: boolean;
  tooltipVisible = false;
  tooltipTimeout;

  constructor(
    @Optional() private router: Router,
    @Optional() private childrenService: ChildrenService
  ) {}

  async ngOnInit() {
    if (this.entityId) {
      this.childrenService
        .getChild(this.entityId)
        .pipe(untilDestroyed(this))
        .subscribe((child) => {
          this.entity = child;
        });
    }
  }

  showTooltip() {
    if (this.tooltipDisabled) {
      return;
    }

    this.tooltipVisible = true;
    if (this.tooltipTimeout) {
      clearTimeout(this.tooltipTimeout);
    }
  }

  hideTooltip() {
    this.tooltipTimeout = setTimeout(() => (this.tooltipVisible = false), 250);
  }

  showDetailsPage() {
    if (this.linkDisabled) {
      return;
    }

    this.router?.navigate(["/child", this.entity.getId()]);
  }
}
