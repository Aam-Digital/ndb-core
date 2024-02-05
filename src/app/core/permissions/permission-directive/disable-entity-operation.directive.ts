import {
  ComponentRef,
  Directive,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewContainerRef,
} from "@angular/core";
import { DisabledWrapperComponent } from "./disabled-wrapper.component";
import { EntityAction, EntitySubject } from "../permission-types";
import { EntityAbility } from "../ability/entity-ability";
import { Unsubscribe } from "@casl/ability";

/**
 * This directive can be used to disable a element (e.g. button) based on the current users permissions.
 * Additionally, a little popup will be shown when the user hovers the disabled element.
 */
@Directive({
  selector: "[appDisabledEntityOperation]",
  standalone: true,
})
export class DisableEntityOperationDirective
  implements OnInit, OnChanges, OnDestroy
{
  /**
   * These arguments are required to check whether the user has permissions to perform the operation.
   * The operation property defines to what kind of operation an element belongs, e.g. OperationType.CREATE
   * The entity property defines for which kind of entity the operation will be performed, e.g. Child
   */
  @Input("appDisabledEntityOperation") arguments: {
    operation: EntityAction;
    entity: EntitySubject;
    field?: string;
  };

  private wrapperComponent: ComponentRef<DisabledWrapperComponent>;
  private text: string = $localize`:Missing permission:Your account does not have the required permission for this action.`;

  private readonly unsubscribeAbilityUpdates: Unsubscribe;

  constructor(
    private templateRef: TemplateRef<HTMLButtonElement>,
    private viewContainerRef: ViewContainerRef,
    private ability: EntityAbility,
  ) {
    this.unsubscribeAbilityUpdates = this.ability.on("updated", () =>
      this.applyPermissions(),
    );
  }

  ngOnDestroy(): void {
    this.unsubscribeAbilityUpdates();
  }

  ngOnInit() {
    this.wrapperComponent = this.viewContainerRef.createComponent(
      DisabledWrapperComponent,
    );
    this.wrapperComponent.instance.template = this.templateRef;
    this.wrapperComponent.instance.text = this.text;
    this.applyPermissions();
  }

  ngOnChanges() {
    this.applyPermissions();
  }

  private applyPermissions() {
    if (
      this.wrapperComponent &&
      this.arguments?.operation &&
      this.arguments?.entity
    ) {
      // Update the disabled property whenever the input values change
      this.wrapperComponent.instance.elementDisabled = this.ability.cannot(
        this.arguments.operation,
        this.arguments.entity,
        this.arguments.field,
      );
      this.wrapperComponent.instance.ngAfterViewInit();
    }
  }
}
