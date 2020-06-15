import { Component, HostListener, Input, OnInit } from "@angular/core";
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
  @Input() linkDisabled: boolean;
  tooltip = false;
  tooltipTimeout;

  constructor(
    private router: Router,
    private childrenService: ChildrenService
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
    this.tooltip = true;
    if (this.tooltipTimeout) {
      clearTimeout(this.tooltipTimeout);
    }
  }
  hideTooltip() {
    this.tooltipTimeout = setTimeout(() => (this.tooltip = false), 250);
  }

  @HostListener("click") onClick() {
    this.showDetailsPage();
  }

  showDetailsPage() {
    if (this.linkDisabled) {
      return;
    }

    this.router.navigate(["/child", this.entity.getId()]);
  }
}
