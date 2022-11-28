import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from "@angular/core";
import { Entity } from "../../../core/entity/model/entity";
import { EntitySchema } from "../../../core/entity/schema/entity-schema";
import { EntitySchemaService } from "../../../core/entity/schema/entity-schema.service";

@Component({
  selector: "app-entity-summary",
  templateUrl: "./entity-summary.component.html",
  styleUrls: ["./entity-summary.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntitySummaryComponent implements OnChanges {
  @Input() entity: Entity;
  entitySchema: EntitySchema;

  @Input() properties;

  constructor(public schemaService: EntitySchemaService) {}

  ngOnChanges(changes: SimpleChanges): void {
    this.entitySchema = this.entity?.getConstructor().schema ?? new Map();
  }
}
