import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ImportAdditionalActionsComponent } from "./import-additional-actions.component";
import { EntityTypeLabelPipe } from "../../common-components/entity-type-label/entity-type-label.pipe";
import { MatDialog } from "@angular/material/dialog";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";

describe("ImportAdditionalActionsComponent", () => {
  let component: ImportAdditionalActionsComponent;
  let fixture: ComponentFixture<ImportAdditionalActionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImportAdditionalActionsComponent, MockedTestingModule],
      providers: [EntityTypeLabelPipe, { provide: MatDialog, useValue: null }],
    }).compileComponents();

    fixture = TestBed.createComponent(ImportAdditionalActionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
