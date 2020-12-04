import {
  Component,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from "@angular/core";
import { Router } from "@angular/router";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { School } from "../model/school";
import { ConfigService } from "app/core/config/config.service";
import { OnInitDynamicComponent } from "../../../core/view/dynamic-components/on-init-dynamic-component.interface";

@Component({
  selector: "app-school-block",
  templateUrl: "./school-block.component.html",
  styleUrls: ["./school-block.component.scss"],
})
export class SchoolBlockComponent
  implements OnInitDynamicComponent, OnChanges, OnInit {
  iconName: String;
  @Input() entity: School = new School("");
  @Input() entityId: string;
  @Input() linkDisabled: boolean;
  tooltip = false;
  tooltipTimeout;

  constructor(
    private router: Router,
    private entityMapper: EntityMapperService,
    private configService: ConfigService
  ) {}

  ngOnInit() {
    this.iconName =
      "fa-" +
      this.configService.getConfig<Object>("view:school/:id")["config"]["icon"];
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.hasOwnProperty("entityId")) {
      this.initFromEntityId();
    }
  }

  onInitFromDynamicConfig(config: any) {
    this.entity = config.entity;
    if (config.hasOwnProperty("entityId")) {
      this.entityId = config.entityId;
      this.initFromEntityId();
    }
    this.linkDisabled = config.linkDisabled;
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
