import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
} from "@angular/core";
import { Entity } from "../../../entity/model/entity";
import { EntitySchemaService } from "../../../entity/schema/entity-schema.service";
import { ColumnConfig } from "../../entity-subrecord/entity-subrecord/entity-subrecord-config";
import { NgIf } from "@angular/common";
import { DynamicComponentDirective } from "../../../view/dynamic-components/dynamic-component.directive";

@Component({
  selector: "app-entity-property-view",
  templateUrl: "./entity-property-view.component.html",
  styleUrls: ["./entity-property-view.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIf, DynamicComponentDirective],
  standalone: true,
})
export class EntityPropertyViewComponent<E extends Entity = Entity>
  implements OnInit
{
  @Input() entity: E;
  @Input() property: ColumnConfig;
  propertyName: string;

  /**
   * (optional) component to be used to display this value.
   * If not explicitly provided, the component is inferred from the entity schema.
   */
  @Input() component?: string;

  @Input() showLabel: boolean = false;

  additional: any;
  label: string;

  constructor(private schemaService: EntitySchemaService) {}

  ngOnInit() {
    if (typeof this.property === "string") {
      const schema = this.entity.getSchema().get(this.property);
      if (!this.component) {
        this.component = this.schemaService.getComponent(schema);
      }
      this.label = schema?.label ?? this.property;
      this.propertyName = this.property;
    } else {
      this.component = this.property.view;
      this.additional = this.property.additional;
      this.label = this.property.label;
      this.propertyName = this.property.id;
    }
  }
}
