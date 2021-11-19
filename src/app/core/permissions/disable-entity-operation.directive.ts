import {
  ComponentFactoryResolver,
  ComponentRef,
  Directive,
  Input,
  OnChanges,
  OnInit,
  TemplateRef,
  ViewContainerRef,
} from "@angular/core";
import { DisabledWrapperComponent } from "./disabled-wrapper/disabled-wrapper.component";
import { SessionService } from "../session/session-service/session.service";
import { LoginState } from "../session/session-states/login-state.enum";
import { filter } from "rxjs/operators";
import { EntityAbility, EntityAction, EntitySubject } from "./permission-types";

/**
 * This directive can be used to disable a element (e.g. button) based on the current users permissions.
 * Additionally, a little popup will be shown when the user hovers the disabled element.
 */
@Directive({
  selector: "[appDisabledEntityOperation]",
})
export class DisableEntityOperationDirective implements OnInit, OnChanges {
  /**
   * These arguments are required to check whether the user has permissions to perform the operation.
   * The operation property defines to what kind of operation a element belongs, e.g. OperationType.CREATE
   * The entity property defines for which kind of entity the operation will be performed, e.g. Child
   */
  @Input("appDisabledEntityOperation") arguments: {
    operation: EntityAction;
    entity: EntitySubject;
  };

  private wrapperComponent: ComponentRef<DisabledWrapperComponent>;
  private text: string = $localize`:Missing permission:Your account does not have the required permission for this action.`;

  constructor(
    private templateRef: TemplateRef<HTMLButtonElement>,
    private viewContainerRef: ViewContainerRef,
    private componentFactoryResolver: ComponentFactoryResolver,
    private ability: EntityAbility,
    private sessionService: SessionService
  ) {
    this.sessionService.loginState
      .pipe(filter((state) => state === LoginState.LOGGED_IN))
      .subscribe(() => this.applyPermissions());
  }

  ngOnInit() {
    const containerFactory = this.componentFactoryResolver.resolveComponentFactory(
      DisabledWrapperComponent
    );
    this.wrapperComponent = this.viewContainerRef.createComponent(
      containerFactory
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
        this.arguments.entity
      );
      this.wrapperComponent.instance.ngAfterViewInit();
    }
  }
}
