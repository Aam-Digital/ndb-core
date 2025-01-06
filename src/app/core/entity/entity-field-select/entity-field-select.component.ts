import { Component, EventEmitter, inject, Input, Output } from "@angular/core";
import { MatFormFieldControl } from "@angular/material/form-field";
import {
  BASIC_AUTOCOMPLETE_COMPONENT_IMPORTS,
  BasicAutocompleteComponent,
} from "app/core/common-components/basic-autocomplete/basic-autocomplete.component";
import { EntityConstructor } from "../model/entity";
import { EntityRegistry } from "../database-entity.decorator";
import { EntitySchemaService } from "../schema/entity-schema.service";
import { DefaultDatatype } from "../default-datatype/default.datatype";
import { EntitySchema } from "../schema/entity-schema";

@Component({
  selector: "app-entity-field-select",
  standalone: true,
  imports: BASIC_AUTOCOMPLETE_COMPONENT_IMPORTS,
  templateUrl:
    "../../common-components/basic-autocomplete/basic-autocomplete.component.html",
  providers: [
    { provide: MatFormFieldControl, useExisting: EntityFieldSelectComponent },
  ],
})
export class EntityFieldSelectComponent extends BasicAutocompleteComponent<string> {
  private entityCtor: EntityConstructor;
  @Input() override placeholder: string =
    $localize`:EntityFieldSelect placeholder: Select Entity Field`;

  labelMapper = (name: string) => this.entityCtor.schema.get(name).label;
  dataTypeMap: { [name: string]: DefaultDatatype };
  selectedEntityField: string;
  @Output() selectedFieldChange = new EventEmitter<string>();

  private entityRegistry = inject(EntityRegistry);
  private entitySchemaService = inject(EntitySchemaService);

  @Input() set entityType(entity: string) {
    if (!entity) {
      return;
    }
    this.initializeEntity(entity);
  }

  private initializeEntity(entity: string): void {
    this.entityCtor = this.entityRegistry.get(entity);
    this.dataTypeMap = {};
    this.options = this.getAllFieldProps(this.entityCtor.schema);
  }

  private getAllFieldProps(schema: EntitySchema): string[] {
    return [...schema.entries()]
      .filter(([_, fieldSchema]) => fieldSchema.label)
      .map(([name, fieldSchema]) => {
        this.dataTypeMap[name] = this.entitySchemaService.getDatatypeOrDefault(
          fieldSchema.dataType,
        );
        return name;
      });
  }

  updateMapping() {
    this.selectedFieldChange.emit(this.selectedEntityField);
  }
}
