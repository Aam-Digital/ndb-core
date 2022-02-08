import {
  Component,
  Input,
  OnChanges,
  Optional,
  SimpleChange,
  SimpleChanges,
} from "@angular/core";
import { Router } from "@angular/router";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { OnInitDynamicComponent } from "../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { ChildrenService } from "../children.service";
import { Child } from "../model/child";
import { DynamicComponent } from "../../../core/view/dynamic-components/dynamic-component.decorator";

@UntilDestroy()
@DynamicComponent()
@Component({
  selector: "app-child-block",
  templateUrl: "./child-block.component.html",
  styleUrls: ["./child-block.component.scss"],
})
export class ChildBlockComponent implements OnInitDynamicComponent, OnChanges {
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

  ngOnChanges(changes: SimpleChanges) {
    if (changes.hasOwnProperty("entityId")) {
      this.childrenService
        .getChild(this.entityId)
        .pipe(untilDestroyed(this))
        .subscribe((child) => {
          this.entity = child;
        });
    }
  }

  onInitFromDynamicConfig(config: any) {
    this.entity = config.entity;
    if (config.hasOwnProperty("entityId")) {
      this.entityId = config.entityId;
      this.ngOnChanges({
        entityId: new SimpleChange(undefined, config.entityId, true),
      });
    }
    this.linkDisabled = config.linkDisabled;
    this.tooltipDisabled = config.tooltipDisabled;
  }

  showTooltip() {
    if (this.tooltipDisabled) {
      return;
    }
    if (this.tooltipTimeout) {
      clearTimeout(this.tooltipTimeout);
    }
    this.tooltipTimeout = setTimeout(() => (this.tooltipVisible = true), 1000);
  }

  hideTooltip() {
    if (this.tooltipTimeout) {
      clearTimeout(this.tooltipTimeout);
    }
    this.tooltipTimeout = setTimeout(() => (this.tooltipVisible = false), 150);
  }

  showDetailsPage() {
    if (this.linkDisabled) {
      return;
    }
    const path = "/" + Child.ENTITY_TYPE.toLowerCase();
    this.router?.navigate([path, this.entity.getId()]);
  }
}
