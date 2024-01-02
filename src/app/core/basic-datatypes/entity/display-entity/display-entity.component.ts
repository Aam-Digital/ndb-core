import { ChangeDetectorRef, Component, Input, OnInit } from "@angular/core";
import { Entity, EntityConstructor } from "../../../entity/model/entity";
import { ViewDirective } from "../../../entity/default-datatype/view.directive";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";
import { EntityMapperService } from "../../../entity/entity-mapper/entity-mapper.service";
import { Router } from "@angular/router";
import { NgClass, NgIf } from "@angular/common";
import { DynamicComponentDirective } from "../../../config/dynamic-components/dynamic-component.directive";

@DynamicComponent("DisplayEntity")
@Component({
  selector: "app-display-entity",
  templateUrl: "./display-entity.component.html",
  styleUrls: ["./display-entity.component.scss"],
  imports: [NgClass, NgIf, DynamicComponentDirective],
  standalone: true,
})
export class DisplayEntityComponent
  extends ViewDirective<string>
  implements OnInit
{
  @Input() entityToDisplay: Entity;
  @Input() linkDisabled = false;

  /**
   * If `entityToDisplay` is not set, `entityId` and `entityType` are required to load the entity
   * If `entityToDisplay` is set, these values are ignored
   */
  @Input() entityId: string;
  @Input() entityType: string | EntityConstructor;
  @Input() config: string;

  entityBlockComponent: string;

  constructor(
    private entityMapper: EntityMapperService,
    private router: Router,
    private changeDetector: ChangeDetectorRef,
  ) {
    super();
  }

  async ngOnInit() {
    if (!this.entityToDisplay) {
      this.entityType = this.entityType ?? this.config;
      this.entityId = this.entityId ?? this.value;
      if (!this.entityType || !this.entityId) {
        return;
      }
      this.entityToDisplay = await this.entityMapper.load(
        this.entityType,
        this.entityId,
      );
      this.changeDetector.detectChanges();
    }
    if (this.entityToDisplay) {
      this.entityBlockComponent = this.entityToDisplay
        .getConstructor()
        .getBlockComponent();
    }
  }

  showDetailsPage() {
    if (this.linkDisabled) {
      return;
    }

    // TODO should we keep short routes?
    this.router.navigate([
      this.entityToDisplay.getConstructor().route,
      this.entityToDisplay.getId(true),
    ]);
  }
}
