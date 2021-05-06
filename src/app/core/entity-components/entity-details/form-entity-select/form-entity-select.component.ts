import { Component, Input } from "@angular/core";
import { ENTITY_MAP } from "../entity-details.component";
import { Entity, EntityConstructor } from "../../../entity/entity";
import { DynamicComponentConfig } from "../../../view/dynamic-components/dynamic-component-config.interface";
import { isRegisteredDynamicComponent } from "../../../view/dynamic-components-map";
import { AbstractControl } from "@angular/forms";

/**
 * A view that shows an entity-select
 * optimized so that it can be used in a configurable forms-component
 */
@Component({
  selector: "app-form-entity-select",
  templateUrl: "./form-entity-select.component.html",
})
export class FormEntitySelectComponent<E extends Entity> {
  /**
   * The block-component used inside the view to display single entities
   */
  entityBlockComponent?: string;
  /**
   * The type of entities this view manages
   */
  entityType: EntityConstructor<E>;
  /** see {@link EntitySelectComponent#label} */
  @Input() label: string;
  /** see {@link EntitySelectComponent#placeholder} */
  @Input() placeholder: string;
  /**
   * the source that the values are from.
   * Currently this assumes all values are string-id's
   */
  @Input() source: { [key: string]: AbstractControl };
  /**
   * The id to get the values by. Used to index {@link source}
   */
  @Input() configId: string;
  /** see {@link EntitySelectComponent#disabled} */
  @Input() disabled: boolean;
  /**
   * the selection, computed via the form
   */
  get selection(): string[] {
    return this.source[this.configId].value;
  }
  /**
   * Sets the selection inside an overlying form
   * @param sel The selection to set
   */
  set selection(sel: string[]) {
    this.source[this.configId].setValue(sel);
  }
  /**
   * The standard-type (e.g. 'Child', 'School', e.t.c.) to set.
   * The standard-type has to be inside {@link ENTITY_MAP}
   * @param type The type of entities that this will set. This will set the
   * actual entity-type as well as the block-component
   * @throws Error when `type` is not in the entity-map
   */
  @Input() set standardType(type: string) {
    this.entityType = ENTITY_MAP.get(type);
    if (!this.entityType) {
      throw new Error(`Entity-Type ${type} not in EntityMap`);
    }
    if (isRegisteredDynamicComponent(type + "Block")) {
      this.entityBlockComponent = type + "Block";
    } else {
      this.entityBlockComponent = undefined;
    }
  }
  /**
   * creates a config for the dynamic component from an entity
   * @param entity The entity to create the config from in the context
   * of this component
   */
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
