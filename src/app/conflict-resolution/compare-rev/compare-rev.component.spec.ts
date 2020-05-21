import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CompareRevComponent } from "./compare-rev.component";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatExpansionModule } from "@angular/material/expansion";
import { FormsModule } from "@angular/forms";
import { ConflictResolutionStrategyService } from "../conflict-resolution-strategy/conflict-resolution-strategy.service";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { ConfirmationDialogService } from "../../core/confirmation-dialog/confirmation-dialog.service";
import { Database } from "../../core/database/database";
import { MockDatabase } from "../../core/database/mock-database";
import { MatSnackBarModule } from "@angular/material/snack-bar";

describe("CompareRevComponent", () => {
  let component: CompareRevComponent;
  let fixture: ComponentFixture<CompareRevComponent>;

  beforeEach(async(() => {
    const confDialogMock = {
      openDialog: () => {},
    };
    spyOn(confDialogMock, "openDialog");

    TestBed.configureTestingModule({
      imports: [
        MatTooltipModule,
        MatExpansionModule,
        MatSnackBarModule,
        FormsModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: ConfirmationDialogService, useValue: confDialogMock },
        { provide: Database, useValue: new MockDatabase() },
        ConflictResolutionStrategyService,
      ],
      declarations: [CompareRevComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CompareRevComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
