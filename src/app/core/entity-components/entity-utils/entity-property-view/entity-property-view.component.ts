import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
} from "@angular/core";
import { Entity } from "../../../entity/model/entity";
import { EntitySchemaService } from "../../../entity/schema/entity-schema.service";

@Component({
  selector: "app-entity-property-view",
  templateUrl: "./entity-property-view.component.html",
  styleUrls: ["./entity-property-view.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityPropertyViewComponent<E extends Entity> implements OnInit {
  @Input() entity: E;
  @Input() property: string;

  /**
   * (optional) component to be used to display this value.
   * If not explicitly provided, the component is inferred from the entity schema.
   */
  @Input() component: string;

  @Input() showLabel: boolean = false;
  label: string;

  constructor(private schemaService: EntitySchemaService) {}

  ngOnInit() {
    if (!this.component) {
      this.component = this.schemaService.getComponent(
        this.entity.getSchema().get(this.property)
      );
    }
    this.label =
      this.entity.getSchema().get(this.property).label ?? this.property;
  }
}
