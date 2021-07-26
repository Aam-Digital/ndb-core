import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";
import { AserComponent } from "./aser.component";
import { FormsModule } from "@angular/forms";
import { ChildrenService } from "../../children/children.service";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { Child } from "../../children/model/child";
import { DatePipe } from "@angular/common";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { of } from "rxjs";
import { ConfirmationDialogModule } from "../../../core/confirmation-dialog/confirmation-dialog.module";
import { FormDialogModule } from "../../../core/form-dialog/form-dialog.module";
import { RouterTestingModule } from "@angular/router/testing";
import { EntitySubrecordModule } from "../../../core/entity-components/entity-subrecord/entity-subrecord.module";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { EntityFormService } from "../../../core/entity-components/entity-form/entity-form.service";
import { SessionService } from "../../../core/session/session-service/session.service";
import { User } from "../../../core/user/user";

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
  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;

  beforeEach(
    waitForAsync(() => {
      mockEntityMapper = jasmine.createSpyObj(["save"]);
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
        ],
        providers: [
          EntityFormService,
          DatePipe,
          { provide: ChildrenService, useValue: mockChildrenService },
          { provide: EntityMapperService, useValue: mockEntityMapper },
          {
            provide: SessionService,
            useValue: { getCurrentUser: () => new User() },
          },
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
