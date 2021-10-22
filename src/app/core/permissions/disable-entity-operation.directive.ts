import {
  ComponentFactoryResolver,
  ComponentRef,
  Directive,
  Input,
  OnInit,
  TemplateRef,
  ViewContainerRef,
} from "@angular/core";
import { OperationType } from "./entity-permissions.service";
import { Entity } from "../entity/model/entity";
import { DisabledWrapperComponent } from "./disabled-wrapper/disabled-wrapper.component";
import { EntityAbility } from "./ability.service";

/**
 * This directive can be used to disable a element (e.g. button) based on the current users permissions.
 * Additionally, a little popup will be shown when the user hovers the disabled element.
 */
@Directive({
  selector: "[appDisabledEntityOperation]",
})
export class DisableEntityOperationDirective implements OnInit {
  /**
   * These arguments are required to check whether the user has permissions to perform the operation.
   * The operation property defines to what kind of operation a element belongs, e.g. OperationType.CREATE
   * The entity property defines for which kind of entity the operation will be performed, e.g. Child
   */
  @Input("appDisabledEntityOperation") arguments: {
    operation: OperationType;
    entity: typeof Entity;
  };

  private wrapperComponent: ComponentRef<DisabledWrapperComponent>;
  private text: string = $localize`:Missing permission:Your account does not have the required permission for this action.`;

  constructor(
    private templateRef: TemplateRef<HTMLButtonElement>,
    private viewContainerRef: ViewContainerRef,
    private componentFactoryResolver: ComponentFactoryResolver,
    private ability: EntityAbility
  ) {}

  ngOnInit() {
    let disabled = false;
    if (this.arguments?.operation && this.arguments?.entity) {
      disabled = this.ability.cannot(
        this.arguments.operation,
        this.arguments.entity
      );
    }
    const containerFactory = this.componentFactoryResolver.resolveComponentFactory(
      DisabledWrapperComponent
    );
    this.wrapperComponent = this.viewContainerRef.createComponent(
      containerFactory
    );
    this.wrapperComponent.instance.template = this.templateRef;
    this.wrapperComponent.instance.text = this.text;
    this.wrapperComponent.instance.elementDisabled = disabled;
  }
}
