import { Component } from "@angular/core";
import { EditComponent } from "../../entity-utils/dynamic-form-components/edit-component";
import { Entity } from "../../../entity/model/entity";
import { DynamicComponent } from "../../../view/dynamic-components/dynamic-component.decorator";
import { EntityMapperService } from "../../../entity/entity-mapper.service";
import { DisplayEntityComponent } from "../display-entity/display-entity.component";
import { BasicAutocompleteComponent } from "../../../configurable-enum/basic-autocomplete/basic-autocomplete.component";
import { ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { NgIf } from "@angular/common";

@DynamicComponent("EditSingleEntity")
@Component({
  selector: "app-edit-single-entity",
  templateUrl: "./edit-single-entity.component.html",
  styleUrls: ["./edit-single-entity.component.scss"],
  imports: [
    BasicAutocompleteComponent,
    DisplayEntityComponent,
    ReactiveFormsModule,
    MatFormFieldModule,
    FontAwesomeModule,
    NgIf,
  ],
  standalone: true,
})
export class EditSingleEntityComponent extends EditComponent<string> {
  entities: Entity[] = [];
  entityToId = (e: Entity) => e?.getId();

  constructor(private entityMapperService: EntityMapperService) {
    super();
  }

  async ngOnInit() {
    super.ngOnInit();
    const entityType: string =
      this.formFieldConfig.additional || this.propertySchema.additional;
    this.entities = await this.entityMapperService.loadType(entityType);
    this.entities.sort((e1, e2) => e1.toString().localeCompare(e2.toString()));
  }
}
