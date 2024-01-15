import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import {
  DetailsComponentData,
  RowDetailsComponent,
} from "./row-details.component";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { Entity } from "../../entity/model/entity";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { EntityAbility } from "../../permissions/ability/entity-ability";
import { NEVER } from "rxjs";

describe("RowDetailsComponent", () => {
  let component: RowDetailsComponent;
  let fixture: ComponentFixture<RowDetailsComponent>;
  let detailsComponentData: DetailsComponentData;

  beforeEach(waitForAsync(() => {
    detailsComponentData = {
      entity: new Entity(),
      columns: [],
    };
    TestBed.configureTestingModule({
      imports: [RowDetailsComponent, MockedTestingModule.withState()],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: detailsComponentData },
        {
          provide: MatDialogRef,
          useValue: { backdropClick: () => NEVER, afterClosed: () => NEVER },
        },
      ],
    }).compileComponents();
    spyOn(TestBed.inject(EntityAbility), "cannot").and.returnValue(true);
  }));

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
