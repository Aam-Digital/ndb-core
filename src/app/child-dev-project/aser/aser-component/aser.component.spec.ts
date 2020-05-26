import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { AserComponent } from "./aser.component";
import { EntitySubrecordModule } from "../../../core/entity-subrecord/entity-subrecord.module";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { ChildrenService } from "../../children/children.service";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { MockDatabase } from "../../../core/database/mock-database";
import { Child } from "../../children/model/child";
import { DatePipe } from "@angular/common";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { of } from "rxjs";
import { EntitySchemaService } from "../../../core/entity/schema/entity-schema.service";
import { Database } from "../../../core/database/database";
import { AlertService } from "app/core/alerts/alert.service";
import { ConfirmationDialogModule } from "../../../core/confirmation-dialog/confirmation-dialog.module";
import { FormDialogModule } from "../../../core/form-dialog/form-dialog.module";

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

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AserComponent],
      imports: [
        FormsModule,
        NoopAnimationsModule,
        EntitySubrecordModule,
        ConfirmationDialogModule,
        FormDialogModule,
      ],
      providers: [
        DatePipe,
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of({ get: () => "22" }) },
        },
        { provide: ChildrenService, useValue: mockChildrenService },
        EntityMapperService,
        EntitySchemaService,
        AlertService,
        { provide: Database, useClass: MockDatabase },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
