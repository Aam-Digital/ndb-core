import { ComponentFixture, TestBed } from "@angular/core/testing";

import {
  DetailsComponentData,
  RowDetailsComponent,
} from "./row-details.component";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { EntityFormService } from "../../entity-form/entity-form.service";
import { FormBuilder } from "@angular/forms";
import { EntityMapperService } from "../../../entity/entity-mapper.service";
import { mockEntityMapper } from "../../../entity/mock-entity-mapper-service";
import { EntitySchemaService } from "../../../entity/schema/entity-schema.service";
import { Entity } from "../../../entity/model/entity";

describe("RowDetailsComponent", () => {
  let component: RowDetailsComponent<any>;
  let fixture: ComponentFixture<RowDetailsComponent<any>>;
  const detailsComponentData: DetailsComponentData<any> = {
    record: new Entity(),
    rows: [],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RowDetailsComponent],
      imports: [MatDialogModule],
      providers: [
        EntityFormService,
        FormBuilder,
        EntitySchemaService,
        { provide: EntityMapperService, useValue: mockEntityMapper() },
        { provide: MAT_DIALOG_DATA, useValue: detailsComponentData },
        { provide: MatDialogRef, useValue: {} },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RowDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
