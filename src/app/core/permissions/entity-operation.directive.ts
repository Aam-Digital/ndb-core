import {
  ComponentFactoryResolver,
  ComponentRef,
  Directive,
  Input,
  OnChanges,
  TemplateRef,
  ViewContainerRef,
} from "@angular/core";
import {
  EntityPermissionsService,
  OperationType,
} from "./entity-permissions.service";
import { Entity } from "../entity/entity";
import { DisabledWrapperComponent } from "./disabled-wrapper/disabled-wrapper.component";

/**
 * This directive can be used to disable a element (e.g. button) based on the current users permissions.
 * Additionally, a little popup will be shown when the user hovers the disabled element.
 */
@Directive({
  selector: "[appEntityOperation]",
})
export class EntityOperationDirective implements OnChanges {
  /**
   * These arguments are required to check whether the user has permissions to perform the operation.
   * The operation property defines to what kind of operation a element belongs, e.g. OperationType.CREATE
   * The entity property defines for which kind of entity the operation will be performed, e.g. Child
   */
  @Input("appEntityOperation") arguments: {
    operation: OperationType;
    entity: typeof Entity;
  };

  private wrapperComponent: ComponentRef<DisabledWrapperComponent>;
  private text: string = "Operation disabled for current user";

  constructor(
    private templateRef: TemplateRef<HTMLButtonElement>,
    private viewContainerRef: ViewContainerRef,
    private componentFactoryResolver: ComponentFactoryResolver,
    private entityPermissionService: EntityPermissionsService
  ) {}

  ngOnChanges() {
    let permitted = true;
    if (this.arguments?.operation && this.arguments?.entity) {
      permitted = this.entityPermissionService.userIsPermitted(
        this.arguments.entity,
        this.arguments.operation
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
    this.wrapperComponent.instance.elementDisabled = !permitted;
  }
}
