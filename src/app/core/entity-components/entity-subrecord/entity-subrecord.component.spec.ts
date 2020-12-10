import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { EntitySubrecordComponent } from "./entity-subrecord.component";
import { RouterTestingModule } from "@angular/router/testing";
import { EntitySubrecordModule } from "./entity-subrecord.module";
import { MockDatabase } from "../../database/mock-database";
import { ConfirmationDialogService } from "../../confirmation-dialog/confirmation-dialog.service";
import { Database } from "../../database/database";

describe("EntitySubrecordComponent", () => {
  let component: EntitySubrecordComponent;
  let fixture: ComponentFixture<EntitySubrecordComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [EntitySubrecordModule, RouterTestingModule],
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
