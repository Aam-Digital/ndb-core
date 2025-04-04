import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";
import { Entity, EntityConstructor } from "app/core/entity/model/entity";

@Component({
  selector: "app-automated-field-mapping",
  imports: [],
  templateUrl: "./automated-field-mapping.component.html",
  styleUrl: "./automated-field-mapping.component.scss",
})
export class AutomatedFieldMappingComponent<E extends Entity>
  implements OnInit
{
  entityConstructor: EntityConstructor;
  entitiesToSetAutomateRule: string;
  constructor(
    @Inject(MAT_DIALOG_DATA)
    data: {
      entity: string;
    },
    private dialogRef: MatDialogRef<any>,
    // private entityFormService: EntityFormService,
    private entityMapperService: EntityMapperService,
  ) {
    this.entitiesToSetAutomateRule = data.entity;
  }

  async ngOnInit(): Promise<void> {
    console.log(
      await this.entityMapperService.loadType(this.entitiesToSetAutomateRule),
      "okay",
    );
    // Initialization logic here
  }
}
