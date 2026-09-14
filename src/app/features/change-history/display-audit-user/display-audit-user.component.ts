import { ChangeDetectionStrategy, Component, computed } from "@angular/core";
import { ViewDirective } from "../../../core/entity/default-datatype/view.directive";
import { DynamicComponent } from "../../../core/config/dynamic-components/dynamic-component.decorator";
import { EntityBlockComponent } from "../../../core/basic-datatypes/entity/entity-block/entity-block.component";

/** the author as the backend records it */
export interface AuditUser {
  id?: string;
  name?: string;
  roles?: string[];
}

/**
 * The author as an entity id, when one was recorded.
 * An entity id is type-prefixed, which a plain username is not.
 */
export function authorEntityId(author: string): string | undefined {
  return author?.includes(":") ? author : undefined;
}

/**
 * Who made an audited change.
 *
 * The backend records whatever the authenticated session carried, which is a
 * user-entity id on systems with user records and a bare username elsewhere.
 * Only the former can be resolved to a record, so the bare name is shown as-is
 * rather than rendered as a broken link.
 */
@DynamicComponent("DisplayAuditUser")
@Component({
  selector: "app-display-audit-user",
  imports: [EntityBlockComponent],
  template: `
    @if (userEntityId()) {
      <app-entity-block
        [entityId]="userEntityId()"
        [showEntityId]="true"
      ></app-entity-block>
    } @else {
      <span>{{ author() || "-" }}</span>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DisplayAuditUserComponent extends ViewDirective<AuditUser> {
  readonly author = computed(
    () => this.value()?.name ?? this.value()?.id ?? "",
  );

  readonly userEntityId = computed(() => authorEntityId(this.author()));
}
