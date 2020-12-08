import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { EntitySubrecordComponent } from "./entity-subrecord.component";
import { MockDatabase } from "../../database/mock-database";
import { Database } from "../../database/database";
import { ConfirmationDialogService } from "../../confirmation-dialog/confirmation-dialog.service";
import { EntityComponentsModule } from "../entity-components.module";
import { RouterTestingModule } from "@angular/router/testing";

describe("EntitySubrecordComponent", () => {
  let component: EntitySubrecordComponent;
  let fixture: ComponentFixture<EntitySubrecordComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [EntityComponentsModule, RouterTestingModule],
      providers: [
        { provide: Database, useClass: MockDatabase },
        {
          provide: ConfirmationDialogService,
          useClass: ConfirmationDialogService,
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EntitySubrecordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
