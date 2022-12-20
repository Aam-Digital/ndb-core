import { ComponentFixture, TestBed } from "@angular/core/testing";

import { TodoDetailsComponent } from "./todo-details.component";
import { AlertService } from "../../../core/alerts/alert.service";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { Todo } from "../model/todo";
import { TodosModule } from "../todos.module";
import { ConfigService } from "../../../core/config/config.service";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { mockEntityMapper } from "../../../core/entity/mock-entity-mapper-service";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("TodoDetailsComponent", () => {
  let component: TodoDetailsComponent;
  let fixture: ComponentFixture<TodoDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TodosModule, FontAwesomeTestingModule],
      providers: [
        { provide: AlertService, useValue: null },
        {
          provide: MAT_DIALOG_DATA,
          useValue: { entity: new Todo(), columns: [] },
        },
        { provide: MatDialogRef, useValue: null },
        { provide: ConfigService, useValue: null },
        { provide: EntityMapperService, useValue: mockEntityMapper() },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TodoDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
