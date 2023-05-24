import { ComponentFixture, TestBed } from "@angular/core/testing";

import {
  DetailsComponentData,
  RowDetailsComponent,
} from "./row-details.component";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { Entity } from "../../../entity/model/entity";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";
import { EntityAbility } from "../../../permissions/ability/entity-ability";
import { NEVER } from "rxjs";

describe("RowDetailsComponent", () => {
  let component: RowDetailsComponent;
  let fixture: ComponentFixture<RowDetailsComponent>;
  let detailsComponentData: DetailsComponentData;

  beforeEach(async () => {
    detailsComponentData = {
      entity: new Entity(),
      columns: [],
    };
    await TestBed.configureTestingModule({
      imports: [RowDetailsComponent, MockedTestingModule.withState()],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: detailsComponentData },
        { provide: MatDialogRef, useValue: { backdropClick: () => NEVER } },
      ],
    }).compileComponents();
    spyOn(TestBed.inject(EntityAbility), "cannot").and.returnValue(true);
  });

  function initComponent() {
    fixture = TestBed.createComponent(RowDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it("should create", () => {
    initComponent();
    expect(component).toBeTruthy();
  });
});
