import {
  AfterViewInit,
  Component,
  Input,
  TemplateRef,
  ViewChild,
} from "@angular/core";
import { OnInitDynamicComponent } from "../../../view/dynamic-components/on-init-dynamic-component.interface";
import { ENTITY_MAP } from "../entity-details.component";
import { Entity, EntityConstructor } from "../../../entity/entity";
import { DynamicComponentConfig } from "../../../view/dynamic-components/dynamic-component-config.interface";
import { isRegisteredDynamicComponent } from "../../../view/dynamic-components-map";
import { EntitySelectComponent } from "../../entity-select/entity-select/entity-select.component";
import { AbstractControl } from "@angular/forms";

@Component({
  selector: "app-form-entity-select",
  templateUrl: "./form-entity-select.component.html",
  styleUrls: ["./form-entity-select.component.scss"],
})
export class FormEntitySelectComponent<E extends Entity> {
  entityBlockComponent: string;
  entityType: EntityConstructor<E>;
  @Input() label: string;
  @Input() placeholder: string;
  @Input() source: { [key: string]: AbstractControl };
  @Input() configId: string;
  @Input() disabled: boolean;

  get selection(): string[] {
    return this.source[this.configId].value;
  }
  set selection(sel: string[]) {
    this.source[this.configId].setValue(sel);
  }

  @Input() set standardType(type: string) {
    this.entityType = ENTITY_MAP.get(type);
    if (!this.entityType) {
      throw new Error(`Entity-Type ${this.standardType} not in EntityMap`);
    }
    if (isRegisteredDynamicComponent(this.standardType + "Block")) {
      this.entityBlockComponent = this.standardType + "Block";
    } else {
      this.entityBlockComponent = null;
    }
  }

  createConfigFor(entity: any): DynamicComponentConfig {
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
