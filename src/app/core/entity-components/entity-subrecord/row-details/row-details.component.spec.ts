import { ComponentFixture, TestBed } from "@angular/core/testing";

import {
  DetailsComponentData,
  RowDetailsComponent,
} from "./row-details.component";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { Entity } from "../../../entity/model/entity";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";
import { EntityRemoveService } from "../../../entity/entity-remove.service";
import { EntitySubrecordModule } from "../entity-subrecord.module";

describe("RowDetailsComponent", () => {
  let component: RowDetailsComponent<any>;
  let fixture: ComponentFixture<RowDetailsComponent<any>>;
  const detailsComponentData: DetailsComponentData<any> = {
    entity: new Entity(),
    columns: [],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntitySubrecordModule, MockedTestingModule.withState()],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: detailsComponentData },
        { provide: MatDialogRef, useValue: {} },
        {
          provide: EntityRemoveService,
          useValue: jasmine.createSpyObj(["remove"]),
        },
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
