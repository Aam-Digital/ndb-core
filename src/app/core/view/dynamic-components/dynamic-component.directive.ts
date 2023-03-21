import {
  ChangeDetectorRef,
  Directive,
  Input,
  OnChanges,
  ViewContainerRef,
} from "@angular/core";
import { DynamicComponentConfig } from "./dynamic-component-config.interface";
import { ComponentRegistry } from "../../../dynamic-components";
import { pick } from "lodash-es";

/**
 * Directive to mark a template into which a component that is dynamically injected from config should be loaded
 *
 * Pass the DynamicComponentConfig into the directive to define the component to be injected.
 *
 * A component that is dynamically injected must implement the {@link OnInitDynamicComponent} interface
 * to allow initialization of input properties from a dynamic config object.
 */
@Directive({
  selector: "[appDynamicComponent]",
  standalone: true,
})
export class DynamicComponentDirective implements OnChanges {
  @Input() appDynamicComponent: DynamicComponentConfig;

  constructor(
    public viewContainerRef: ViewContainerRef,
    private components: ComponentRegistry,
    private changeDetector: ChangeDetectorRef
  ) {}

  async ngOnChanges() {
    await this.loadDynamicComponent();
  }

  private async loadDynamicComponent() {
    if (!this.appDynamicComponent) {
      return;
    }

    const component = await this.components.get(
      this.appDynamicComponent.component
    )();

    this.viewContainerRef.clear();

    const componentRef = this.viewContainerRef.createComponent(component);

    const inputs = Object.keys(component.prototype.constructor["ɵcmp"].inputs);
    const inputValues = pick(this.appDynamicComponent.config, inputs);
    Object.assign(componentRef.instance, inputValues);
    // it seems like the asynchronicity of this function requires this
    this.changeDetector.detectChanges();
  }
}
