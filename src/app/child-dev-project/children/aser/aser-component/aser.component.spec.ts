import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";
import { AserComponent } from "./aser.component";
import { FormsModule } from "@angular/forms";
import { ChildrenService } from "../../children.service";
import { Child } from "../../model/child";
import { DatePipe } from "@angular/common";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { of } from "rxjs";
import { ConfirmationDialogModule } from "../../../../core/confirmation-dialog/confirmation-dialog.module";
import { FormDialogModule } from "../../../../core/form-dialog/form-dialog.module";
import { RouterTestingModule } from "@angular/router/testing";
import { EntitySubrecordModule } from "../../../../core/entity-components/entity-subrecord/entity-subrecord.module";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { EntityFormService } from "../../../../core/entity-components/entity-form/entity-form.service";
import { MockSessionModule } from "../../../../core/session/mock-session.module";

describe("AserComponent", () => {
  let component: AserComponent;
  let fixture: ComponentFixture<AserComponent>;

  const mockChildrenService = {
    getChild: () => {
      return of([new Child("22")]);
    },
    getAserResultsOfChild: () => {
      return of([]);
    },
  };

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [AserComponent],
        imports: [
          FormsModule,
          NoopAnimationsModule,
          ConfirmationDialogModule,
          FormDialogModule,
          RouterTestingModule,
          EntitySubrecordModule,
          MatSnackBarModule,
          MockSessionModule.withState(),
        ],
        providers: [
          EntityFormService,
          DatePipe,
          { provide: ChildrenService, useValue: mockChildrenService },
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(AserComponent);
    component = fixture.componentInstance;
    component.child = new Child("22");
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
