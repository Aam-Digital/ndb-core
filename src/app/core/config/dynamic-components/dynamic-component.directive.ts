import {
  ChangeDetectorRef,
  ComponentRef,
  Directive,
  Input,
  OnChanges,
  Type,
  ViewContainerRef,
  inject,
} from "@angular/core";
import { DynamicComponentConfig } from "./dynamic-component-config.interface";
import { ComponentRegistry } from "../../../dynamic-components";
import { Logging } from "../../logging/logging.service";

/**
 * Directive to mark a template into which a component that is dynamically injected from config should be loaded
 *
 * Pass the DynamicComponentConfig into the directive to define the component to be injected.
 *
 * Configurations that match properties with an `@Input()` annotations are automatically assigned
 */
@Directive({
  selector: "[appDynamicComponent]",
  standalone: true,
})
export class DynamicComponentDirective implements OnChanges {
  viewContainerRef = inject(ViewContainerRef);
  private components = inject(ComponentRegistry);
  private changeDetector = inject(ChangeDetectorRef);

  @Input() appDynamicComponent: DynamicComponentConfig;

  ngOnChanges() {
    return this.loadDynamicComponent();
  }

  private async loadDynamicComponent() {
    if (!this.appDynamicComponent) {
      return;
    }

    let component: Type<any>;
    try {
      component = await this.components.get(
        this.appDynamicComponent.component,
      )();
    } catch (e) {
      Logging.error({
        message: `Failed to load dynamic component ${this.appDynamicComponent?.component} for ${this.appDynamicComponent?.config?.id}`,
        error: e,
      });
      // abort if component failed to load
      return;
    }

    this.viewContainerRef.clear();

    const componentRef = this.viewContainerRef.createComponent(component);

    if (this.appDynamicComponent.config) {
      this.setInputProperties(componentRef);
    }
    // it seems like the asynchronicity of this function requires this
    this.changeDetector.detectChanges();
  }

  private setInputProperties(componentRef: ComponentRef<any>) {
    const inputs = Object.keys(
      componentRef.componentType.prototype.constructor["ɵcmp"].inputs,
    ).filter((input) => this.appDynamicComponent.config?.[input] !== undefined);

    for (const inputName of inputs) {
      componentRef.setInput(
        inputName,
        this.appDynamicComponent.config[inputName],
      );
    }
  }
}
