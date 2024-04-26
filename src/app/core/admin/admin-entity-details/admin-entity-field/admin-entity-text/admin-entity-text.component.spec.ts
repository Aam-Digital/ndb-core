import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AdminEntityTextComponent } from "./admin-entity-text.component";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { Entity } from "app/core/entity/model/entity";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";

fdescribe("AdminEntityTextComponent", () => {
  let component: AdminEntityTextComponent;
  let fixture: ComponentFixture<AdminEntityTextComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AdminEntityTextComponent,
        FontAwesomeTestingModule,
        NoopAnimationsModule,
      ],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            entitySchemaField: {},
            entityType: Entity,
          },
        },
        { provide: MatDialogRef, useValue: { close: () => null } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminEntityTextComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
