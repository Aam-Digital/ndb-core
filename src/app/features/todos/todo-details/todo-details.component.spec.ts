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
import { SessionService } from "../../../core/session/session-service/session.service";
import { TodoService } from "../todo.service";
import { AbilityService } from "../../../core/permissions/ability/ability.service";
import { of } from "rxjs";
import { Angulartics2 } from "angulartics2";

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
        { provide: SessionService, useValue: null },
        { provide: EntityMapperService, useValue: mockEntityMapper() },
        { provide: TodoService, useValue: null },
        { provide: AbilityService, useValue: { abilityUpdated: of() } },
        { provide: Angulartics2, useValue: null },
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
