import {
  ChangeDetectorRef,
  Directive,
  Input,
  OnChanges,
  SimpleChange,
  SimpleChanges,
  ViewContainerRef,
} from "@angular/core";
import { DynamicComponentConfig } from "./dynamic-component-config.interface";
import { ComponentRegistry } from "../../../dynamic-components";
import { pick } from "lodash-es";
import { LoggingService } from "../../logging/logging.service";

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
  @Input() appDynamicComponent: DynamicComponentConfig;

  constructor(
    public viewContainerRef: ViewContainerRef,
    private components: ComponentRegistry,
    private changeDetector: ChangeDetectorRef,
    private logger: LoggingService,
  ) {}

  ngOnChanges() {
    return this.loadDynamicComponent();
  }

  private async loadDynamicComponent() {
    if (!this.appDynamicComponent) {
      return;
    }

    let component;
    try {
      component = await this.components.get(
        this.appDynamicComponent.component,
      )();
    } catch (e) {
      this.logger.error(
        `Failed to load dynamic component:\n${JSON.stringify(
          this.appDynamicComponent,
        )}`,
      );
      // abort if component failed to load
      return;
    }

    this.viewContainerRef.clear();

    const componentRef = this.viewContainerRef.createComponent(component);

    if (this.appDynamicComponent.config) {
      this.setInputProperties(component.prototype, componentRef.instance);
    }
    // it seems like the asynchronicity of this function requires this
    this.changeDetector.detectChanges();
  }

  private setInputProperties(proto, component) {
    const inputs = Object.keys(proto.constructor["ɵcmp"].inputs).filter(
      (input) => this.appDynamicComponent.config?.[input] !== undefined,
    );
    const inputValues = pick(this.appDynamicComponent.config, inputs);
    const initialValues = pick(component, inputs);
    Object.assign(component, inputValues);

    if (
      typeof component["ngOnChanges"] === "function" &&
      Object.keys(inputValues).length > 0
    ) {
      const changes: SimpleChanges = inputs.reduce(
        (c, prop) =>
          Object.assign(c, {
            [prop]: new SimpleChange(
              initialValues[prop],
              inputValues[prop],
              true,
            ),
          }),
        {},
      );
      component["ngOnChanges"](changes);
    }
  }
}
