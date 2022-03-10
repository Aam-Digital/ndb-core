import { ComponentFixture, TestBed } from "@angular/core/testing";

import { PrimaryActionComponent } from "./primary-action.component";
import { MatButtonModule } from "@angular/material/button";
import { MatDialogModule } from "@angular/material/dialog";
import { FormDialogModule } from "../../form-dialog/form-dialog.module";
import { PermissionsModule } from "../../permissions/permissions.module";
import { MockSessionModule } from "../../session/mock-session.module";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import { ENTITIES, entityRegistry } from "../../registry/dynamic-registry";

describe("PrimaryActionComponent", () => {
  let component: PrimaryActionComponent;
  let fixture: ComponentFixture<PrimaryActionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PrimaryActionComponent],
      imports: [
        MatDialogModule,
        MatButtonModule,
        FormDialogModule,
        PermissionsModule,
        FontAwesomeTestingModule,
        MockSessionModule.withState(),
      ],
      providers: [
        EntitySchemaService,
        { provide: ENTITIES, useValue: entityRegistry },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PrimaryActionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
