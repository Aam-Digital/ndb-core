import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EditFileComponent } from "./edit-file.component";
import { FileModule } from "../file.module";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { AlertService } from "../../alerts/alert.service";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { MatDialogModule } from "@angular/material/dialog";
import { ConfirmationDialogService } from "../../confirmation-dialog/confirmation-dialog.service";
import { FormControl } from "@angular/forms";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("EditFileComponent", () => {
  let component: EditFileComponent;
  let fixture: ComponentFixture<EditFileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EditFileComponent],
      imports: [
        FileModule,
        MockedTestingModule.withState(),
        HttpClientTestingModule,
        MatSnackBarModule,
        MatDialogModule,
        FontAwesomeTestingModule,
      ],
      providers: [AlertService, ConfirmationDialogService],
    }).compileComponents();

    fixture = TestBed.createComponent(EditFileComponent);
    component = fixture.componentInstance;
    component.formControl = new FormControl("");
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
