import {
  ChangeDetectorRef,
  ComponentRef,
  Directive,
  Input,
  OnChanges,
  OnDestroy,
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
export class DynamicComponentDirective implements OnChanges, OnDestroy {
  viewContainerRef = inject(ViewContainerRef);
  private components = inject(ComponentRegistry);
  private changeDetector = inject(ChangeDetectorRef);
  private isDestroyed = false;
  private loadSequence = 0;

  @Input() appDynamicComponent: DynamicComponentConfig;

  ngOnChanges() {
    return this.loadDynamicComponent();
  }

  ngOnDestroy(): void {
    this.isDestroyed = true;
    this.loadSequence++;
  }

  private async loadDynamicComponent() {
    const dynamicComponentConfig = this.appDynamicComponent;
    if (!dynamicComponentConfig) {
      return;
    }
    const currentLoad = ++this.loadSequence;

    let component: Type<any>;
    try {
      component = await this.components.get(dynamicComponentConfig.component)();
    } catch (e) {
      Logging.error({
        message: `Failed to load dynamic component ${dynamicComponentConfig.component} for ${dynamicComponentConfig?.config?.id}`,
        error: e,
      });
      // abort if component failed to load
      return;
    }
    if (this.shouldAbortLoad(currentLoad)) {
      return;
    }

    this.viewContainerRef.clear();

    let componentRef: ComponentRef<any>;
    try {
      componentRef = this.viewContainerRef.createComponent(component);
    } catch (error) {
      if (this.shouldAbortLoad(currentLoad)) {
        return;
      }
      throw error;
    }

    if (dynamicComponentConfig.config) {
      this.setInputProperties(componentRef, dynamicComponentConfig.config);
    }
    // it seems like the asynchronicity of this function requires this
    if (this.shouldAbortLoad(currentLoad)) {
      return;
    }
    this.changeDetector.detectChanges();
  }

  private setInputProperties(
    componentRef: ComponentRef<any>,
    componentConfig: Record<string, unknown>,
  ) {
    const inputs = Object.keys(
      componentRef.componentType.prototype.constructor["ɵcmp"].inputs,
    ).filter((input) => componentConfig[input] !== undefined);

    for (const inputName of inputs) {
      componentRef.setInput(inputName, componentConfig[inputName]);
    }
  }

  private shouldAbortLoad(currentLoad: number): boolean {
    return this.isDestroyed || currentLoad !== this.loadSequence;
  }
}
