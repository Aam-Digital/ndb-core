import { ComponentFixture, TestBed } from "@angular/core/testing";

import {
  DetailsComponentData,
  RowDetailsComponent,
} from "./row-details.component";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { EntityFormService } from "../../entity-form/entity-form.service";
import { ReactiveFormsModule } from "@angular/forms";
import { EntitySchemaService } from "../../../entity/schema/entity-schema.service";
import { Entity } from "../../../entity/model/entity";
import { MockSessionModule } from "../../../session/mock-session.module";
import { MatMenuModule } from "@angular/material/menu";
import { EntityRemoveService } from "../../../entity/entity-remove.service";

describe("RowDetailsComponent", () => {
  let component: RowDetailsComponent<any>;
  let fixture: ComponentFixture<RowDetailsComponent<any>>;
  const detailsComponentData: DetailsComponentData<any> = {
    entity: new Entity(),
    columns: [],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RowDetailsComponent],
      imports: [
        MatDialogModule,
        ReactiveFormsModule,
        MockSessionModule.withState(),
        MatMenuModule,
      ],
      providers: [
        EntityFormService,
        EntitySchemaService,
        { provide: MAT_DIALOG_DATA, useValue: detailsComponentData },
        { provide: MatDialogRef, useValue: {} },
        {
          provide: EntityRemoveService,
          useValue: jasmine.createSpyObj(["remove"]),
        },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RowDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
