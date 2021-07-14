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
import { OnInitDynamicComponent } from "../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { ConfigService } from "../../../core/config/config.service";
import { ViewConfig } from "../../../core/view/dynamic-routing/view-config.interface";

@Component({
  selector: "app-school-block",
  templateUrl: "./school-block.component.html",
  styleUrls: ["./school-block.component.scss"],
})
export class SchoolBlockComponent
  implements OnInitDynamicComponent, OnChanges, OnInit
{
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
      this.configService.getConfig<ViewConfig>("view:school/:id")?.config?.icon;
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
    if (this.tooltipTimeout) {
      clearTimeout(this.tooltipTimeout);
    }
    this.tooltipTimeout = setTimeout(() => (this.tooltip = true), 1000);
  }
  hideTooltip() {
    if (this.tooltipTimeout) {
      clearTimeout(this.tooltipTimeout);
    }
    this.tooltipTimeout = setTimeout(() => (this.tooltip = false), 150);
  }

  @HostListener("click") onClick() {
    this.showDetailsPage();
  }

  showDetailsPage() {
    if (this.linkDisabled) {
      return;
    }
    const path = "/" + School.ENTITY_TYPE.toLowerCase();
    this.router?.navigate([path, this.entity.getId()]);
  }
}
