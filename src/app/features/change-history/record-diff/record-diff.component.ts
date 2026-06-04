import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from "@angular/core";
import { EntityFieldViewComponent } from "../../../core/entity/entity-field-view/entity-field-view.component";
import { EntityFieldLabelComponent } from "../../../core/entity/entity-field-label/entity-field-label.component";
import { FaDynamicIconComponent } from "../../../core/common-components/fa-dynamic-icon/fa-dynamic-icon.component";
import { EntitySchemaService } from "../../../core/entity/schema/entity-schema.service";
import { Entity, EntityConstructor } from "../../../core/entity/model/entity";
import { ChangeEvent } from "../change-history.types";

interface DiffRow {
  field: string;
  /** transient entity holding only the "before" value, hydrated via the schema */
  oldEntity: Entity;
  /** transient entity holding only the "after" value, hydrated via the schema */
  newEntity: Entity;
  hasFrom: boolean;
  hasTo: boolean;
}

/**
 * Renders the field-level before -> after diff of a single {@link ChangeEvent}.
 *
 * Values are raw database-format (enum ids, ISO date strings, entity-ref ids).
 * To render them through the correct datatype view (and avoid `[object Object]`
 * / raw ISO strings) each side is loaded into a transient entity via
 * {@link EntitySchemaService.loadDataIntoEntity}, then displayed with
 * `app-entity-field-view` — the same mechanism the merge/compare UI uses.
 */
@Component({
  selector: "app-record-diff",
  standalone: true,
  imports: [
    EntityFieldViewComponent,
    EntityFieldLabelComponent,
    FaDynamicIconComponent,
  ],
  templateUrl: "./record-diff.component.html",
  styleUrls: ["./record-diff.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecordDiffComponent {
  readonly event = input.required<ChangeEvent>();
  readonly entityType = input.required<EntityConstructor>();

  private readonly schemaService = inject(EntitySchemaService);

  /** a deleted record has no before/after pairs — show a structural message */
  readonly isStructural = computed(() => this.event().action === "deleted");

  readonly rows = computed<DiffRow[]>(() => {
    const ctor = this.entityType();
    return this.event().changes.map((change) => ({
      field: change.field,
      oldEntity: this.schemaService.loadDataIntoEntity(
        new ctor(),
        this.seed(change.field, change.from),
      ),
      newEntity: this.schemaService.loadDataIntoEntity(
        new ctor(),
        this.seed(change.field, change.to),
      ),
      hasFrom: !this.isEmpty(change.from),
      hasTo: !this.isEmpty(change.to),
    }));
  });

  private seed(field: string, value: any): object {
    return this.isEmpty(value) ? {} : { [field]: value };
  }

  private isEmpty(value: any): boolean {
    return (
      value === undefined ||
      value === null ||
      value === "" ||
      (Array.isArray(value) && value.length === 0)
    );
  }
}
