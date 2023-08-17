import { Component, OnInit } from "@angular/core";
import { EditComponent } from "../../entity-properties/edit/edit-component";
import { Entity } from "../../../entity/model/entity";
import { DynamicComponent } from "../../../view/dynamic-components/dynamic-component.decorator";
import { EntityMapperService } from "../../../entity/entity-mapper.service";
import { DisplayEntityComponent } from "../display-entity/display-entity.component";
import { BasicAutocompleteComponent } from "../../../configurable-enum/basic-autocomplete/basic-autocomplete.component";
import { ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { NgIf } from "@angular/common";
import { ErrorHintComponent } from "../../utils/error-hint/error-hint.component";

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
    ErrorHintComponent,
  ],
  standalone: true,
})
export class EditSingleEntityComponent
  extends EditComponent<string>
  implements OnInit
{
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
