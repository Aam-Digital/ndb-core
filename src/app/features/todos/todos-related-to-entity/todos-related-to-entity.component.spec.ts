import { ComponentFixture, TestBed } from "@angular/core/testing";

import { TodosRelatedToEntityComponent } from "./todos-related-to-entity.component";
import { DatabaseIndexingService } from "../../../core/entity/database-indexing/database-indexing.service";
import { SessionService } from "app/core/session/session-service/session.service";
import { AlertService } from "../../../core/alerts/alert.service";
import { FormDialogService } from "../../../core/form-dialog/form-dialog.service";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";

describe("TodosRelatedToEntityComponent", () => {
  let component: TodosRelatedToEntityComponent;
  let fixture: ComponentFixture<TodosRelatedToEntityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TodosRelatedToEntityComponent],
      providers: [
        {
          provide: DatabaseIndexingService,
          useValue: jasmine.createSpyObj([
            "generateIndexOnProperty",
            "queryIndexDocs",
          ]),
        },
        { provide: SessionService, useValue: null },
        { provide: AlertService, useValue: null },
        { provide: FormDialogService, useValue: null },
      ],
      schemas: [
        CUSTOM_ELEMENTS_SCHEMA, // ignore countless dependencies of entity-subrecord
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TodosRelatedToEntityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
