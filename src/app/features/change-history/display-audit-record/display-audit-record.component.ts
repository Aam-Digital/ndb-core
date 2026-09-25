import { ChangeDetectionStrategy, Component } from "@angular/core";
import { ViewDirective } from "../../../core/entity/default-datatype/view.directive";
import { DynamicComponent } from "../../../core/config/dynamic-components/dynamic-component.decorator";
import { EntityBlockComponent } from "../../../core/basic-datatypes/entity/entity-block/entity-block.component";
import { RecordIdDisplayComponent } from "../../../core/common-components/record-id-display/record-id-display.component";

/**
 * The record one audited change was made to: its name, with the raw id quietly
 * underneath.
 *
 * The id is shown because a change log row is often the only place a deleted
 * record still appears, where there is no details view left to look it up in -
 * and because it is what the related-record filter takes.
 */
@DynamicComponent("DisplayAuditRecord")
@Component({
  selector: "app-display-audit-record",
  imports: [EntityBlockComponent, RecordIdDisplayComponent],
  template: `
    @if (value()) {
      <div class="flex-column">
        <app-entity-block [entityId]="value()"></app-entity-block>
        <app-record-id-display [recordId]="value()"></app-record-id-display>
      </div>
    } @else {
      <span>-</span>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DisplayAuditRecordComponent extends ViewDirective<string> {}
