import { DestroyRef, inject, Pipe, PipeTransform, signal } from "@angular/core";
import { EntityAbility } from "../ability/entity-ability";
import { EntityActionPermission, EntitySubject } from "../permission-types";

/**
 * Check in a template whether the current user may perform an action on an
 * entity or entity type, e.g. `@if ("update" | able: "Config") { ... }`.
 *
 * For disabling an element rather than hiding it, use
 * {@link DisableEntityOperationDirective} instead.
 */
@Pipe({
  name: "able",
  pure: false,
})
export class AblePipe implements PipeTransform {
  private readonly ability = inject(EntityAbility);

  /**
   * Bumped whenever the rules change, and read in `transform`, so that views
   * using this pipe are marked dirty. Without it the pipe would only be
   * re-evaluated while something else happens to check the view, which for the
   * OnPush components using it can be never.
   */
  private readonly rulesChanged = signal(0);

  constructor() {
    const unsubscribe = this.ability.on("updated", () =>
      this.rulesChanged.update((count) => count + 1),
    );
    inject(DestroyRef).onDestroy(unsubscribe);
  }

  transform(
    action: EntityActionPermission,
    subject: EntitySubject,
    field?: string,
  ): boolean {
    this.rulesChanged();
    return this.ability.can(action, subject, field);
  }
}
