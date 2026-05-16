import {
  ComponentRef,
  DestroyRef,
  Directive,
  TemplateRef,
  ViewContainerRef,
  effect,
  inject,
  input,
} from "@angular/core";
import { DisabledWrapperComponent } from "./disabled-wrapper.component";
import { EntityActionPermission, EntitySubject } from "../permission-types";
import { EntityAbility } from "../ability/entity-ability";
import { asArray } from "#src/app/utils/asArray";

/**
 * This directive can be used to disable a element (e.g. button) based on the current users permissions.
 * Additionally, a little popup will be shown when the user hovers the disabled element.
 */
@Directive({
  selector: "[appDisabledEntityOperation]",
  standalone: true,
})
export class DisableEntityOperationDirective {
  private readonly templateRef =
    inject<TemplateRef<HTMLButtonElement>>(TemplateRef);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly ability = inject(EntityAbility);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * These arguments are required to check whether the user has permissions to perform the operation.
   * The operation property defines to what kind of operation an element belongs, e.g. OperationType.CREATE
   * The entity property defines for which kind of entity the operation will be performed, e.g. Child
   *
   * If an array of subjects is provided, the element will only be disabled if the user
   * has permissions for none of them.
   */
  arguments = input<
    | {
        operation: EntityActionPermission;
        entity: EntitySubject | EntitySubject[];
        field?: string;
      }
    | undefined
  >(undefined, { alias: "appDisabledEntityOperation" });

  private readonly wrapperComponent: ComponentRef<DisabledWrapperComponent> =
    this.viewContainerRef.createComponent(DisabledWrapperComponent);
  private readonly text = $localize`:Missing permission:Your account does not have the required permission for this action.`;

  constructor() {
    this.wrapperComponent.setInput("template", this.templateRef);
    this.wrapperComponent.setInput("text", this.text);
    this.wrapperComponent.changeDetectorRef.detectChanges();

    const unsubscribeAbilityUpdates = this.ability.on("updated", () => {
      this.applyPermissions(this.arguments());
    });
    this.destroyRef.onDestroy(unsubscribeAbilityUpdates);

    effect(() => {
      this.applyPermissions(this.arguments());
    });
  }

  private applyPermissions(
    argumentsValue:
      | {
          operation: EntityActionPermission;
          entity: EntitySubject | EntitySubject[];
          field?: string;
        }
      | undefined,
  ): void {
    if (!argumentsValue?.operation || !argumentsValue?.entity) {
      return;
    }

    const entities = asArray(argumentsValue.entity);
    this.wrapperComponent.setInput(
      "elementDisabled",
      entities.every((entity) =>
        this.ability.cannot(
          argumentsValue.operation,
          entity,
          argumentsValue.field,
        ),
      ),
    );
    this.wrapperComponent.changeDetectorRef.detectChanges();
  }
}
