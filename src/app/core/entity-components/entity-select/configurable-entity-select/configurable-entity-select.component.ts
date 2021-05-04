import { Component, Input } from "@angular/core";
import { OnInitDynamicComponent } from "../../../view/dynamic-components/on-init-dynamic-component.interface";
import { ENTITY_MAP } from "../../entity-details/entity-details.component";
import { Entity, EntityConstructor } from "../../../entity/entity";
import { DynamicComponentConfig } from "../../../view/dynamic-components/dynamic-component-config.interface";
import { isRegisteredDynamicComponent } from "../../../view/dynamic-components-map";

@Component({
  selector: "app-configurable-entity-select",
  templateUrl: "./configurable-entity-select.component.html",
  styleUrls: ["./configurable-entity-select.component.scss"],
})
export class ConfigurableEntitySelectComponent<E extends Entity>
  implements OnInitDynamicComponent {
  entityType: EntityConstructor<E>;
  entityBlockComponent: string;
  @Input() source: object;
  @Input() label: string = "";
  @Input() placeholder: string = "";
  @Input() configId: string;
  @Input() disabled: boolean;
  get selection(): string[] {
    return this.source[this.configId];
  }
  select(ids: any) {
    this.source[this.configId] = ids;
  }

  @Input() set standardType(type: string) {
    this.entityType = ENTITY_MAP.get(type);
    if (!this.entityType) {
      throw new Error(`Entity-Type ${type} not in EntityMap`);
    }
    if (isRegisteredDynamicComponent(type + "Block")) {
      this.entityBlockComponent = type + "Block";
    } else {
      this.entityBlockComponent = null;
    }
  }

  onInitFromDynamicConfig(config: any) {
    this.standardType = config.entityType;
    this.source = config.entity;
    this.label = config.label || "";
    this.placeholder = config.placeholder || "";
  }

  getConfigFor(entity: any): DynamicComponentConfig {
    return {
      component: this.entityBlockComponent,
      config: {
        entity: entity,
        linkDisabled: true,
        tooltipDisabled: true,
      },
    };
  }
}
