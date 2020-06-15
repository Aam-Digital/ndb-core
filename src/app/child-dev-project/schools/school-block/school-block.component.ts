import {
  Component,
  HostListener,
  Input,
  OnChanges,
  SimpleChanges,
} from "@angular/core";
import { Router } from "@angular/router";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { School } from "../model/school";

@Component({
  selector: "app-school-block",
  templateUrl: "./school-block.component.html",
  styleUrls: ["./school-block.component.scss"],
})
export class SchoolBlockComponent implements OnChanges {
  @Input() entity: School = new School("");
  @Input() entityId: string;
  @Input() linkDisabled: boolean;
  tooltip = false;
  tooltipTimeout;

  constructor(
    private router: Router,
    private entityMapper: EntityMapperService
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes.hasOwnProperty("entityId")) {
      this.initFromEntityId();
    }
  }

  private async initFromEntityId() {
    if (!this.entityId) {
      return;
    }
    this.entity = await this.entityMapper.load(School, this.entityId);
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
    if (!this.linkDisabled) {
      this.router.navigate(["/school", this.entity.getId()]);
    }
  }
}
