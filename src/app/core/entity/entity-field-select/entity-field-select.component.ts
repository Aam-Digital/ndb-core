import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatFormField, MatLabel } from "@angular/material/form-field";
import { BasicAutocompleteComponent } from "app/core/common-components/basic-autocomplete/basic-autocomplete.component";
import { EntityConstructor } from "../model/entity";
import { EntityRegistry } from "../database-entity.decorator";
import { EntitySchemaService } from "../schema/entity-schema.service";
import { DefaultDatatype } from "../default-datatype/default.datatype";
import { EntitySchema } from "../schema/entity-schema";

@Component({
  selector: "app-entity-field-select",
  standalone: true,
  imports: [
    MatFormField,
    MatLabel,
    ReactiveFormsModule,
    BasicAutocompleteComponent,
    FormsModule,
  ],
  templateUrl: "./entity-field-select.component.html",
})
export class EntityFieldSelectComponent {
  private entityCtor: EntityConstructor;
  @Input() label: string =
    $localize`:EntityFieldSelect label: Select Entity Field`;
  @Input() placeholder =
    $localize`:EntityFieldSelect placeholder:Select Entity Field`;

  labelMapper = (name: string) => this.entityCtor.schema.get(name).label;
  allFieldProps: string[] = [];
  dataTypeMap: { [name: string]: DefaultDatatype };
  selectedEntityField: string;
  @Output() selectedFieldChange = new EventEmitter<string>();

  constructor(
    private entities: EntityRegistry,
    private schemaService: EntitySchemaService,
  ) {}

  @Input() set entityType(entity: string) {
    if (!entity) {
      return;
    }
    this.initializeEntity(entity);
  }

  private initializeEntity(entity: string): void {
    this.entityCtor = this.entities.get(entity);
    this.dataTypeMap = {};
    this.allFieldProps = this.getAllFieldProps(this.entityCtor.schema);
  }

  private getAllFieldProps(schema: EntitySchema): string[] {
    return [...schema.entries()]
      .filter(([_, fieldSchema]) => fieldSchema.label)
      .map(([name, fieldSchema]) => {
        this.dataTypeMap[name] = this.schemaService.getDatatypeOrDefault(
          fieldSchema.dataType,
        );
        return name;
      });
  }

  updateMapping() {
    this.selectedFieldChange.emit(this.selectedEntityField);
  }
}
