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
  /**
   * Tracks the latest async load request.
   *
   * This prevents outdated dynamic imports from creating a component after the
   * input changed again or the directive was already destroyed.
   */
  private loadSequence = 0;

  @Input() appDynamicComponent: DynamicComponentConfig;

  ngOnChanges() {
    return this.loadDynamicComponent();
  }

  ngOnDestroy(): void {
    this.isDestroyed = true;
    this.loadSequence++;
  }

  /**
   * Loads the configured dynamic component and ignores stale async results.
   *
   * The extra sequencing is needed because config changes can trigger multiple
   * overlapping dynamic imports. Only the most recent load should render.
   */
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
      // the message stays static and the varying details go into the context,
      // so that one problem is one issue in remote monitoring: interpolating
      // the component name here split a single failed page load across one
      // issue per field component. Passing the caught error as context (rather
      // than as a property of the logged object) keeps it linked as the
      // reported error's `cause`, which is what distinguishes a chunk that
      // could not be fetched from a component missing in the registry.
      Logging.error("Failed to load dynamic component", e, {
        component: dynamicComponentConfig.component,
        id: dynamicComponentConfig?.config?.id,
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
