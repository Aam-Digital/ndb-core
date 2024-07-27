import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from "@angular/core/testing";

import {
  DetailsComponentData,
  RowDetailsComponent,
} from "./row-details.component";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { Entity } from "../../entity/model/entity";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { EntityAbility } from "../../permissions/ability/entity-ability";
import { NEVER } from "rxjs";
import {
  EntityForm,
  EntityFormService,
} from "../../common-components/entity-form/entity-form.service";
import { FormBuilder } from "@angular/forms";

describe("RowDetailsComponent", () => {
  let component: RowDetailsComponent;
  let fixture: ComponentFixture<RowDetailsComponent>;
  let detailsComponentData: DetailsComponentData;

  let mockFormService: jasmine.SpyObj<EntityFormService>;

  beforeEach(waitForAsync(() => {
    mockFormService = jasmine.createSpyObj(["createEntityForm"]);
    mockFormService.createEntityForm.and.returnValue(
      Promise.resolve({
        formGroup: new FormBuilder().group({}),
      } as EntityForm<any>),
    );
    detailsComponentData = {
      entity: new Entity(),
      columns: [],
    };
    TestBed.configureTestingModule({
      imports: [RowDetailsComponent, MockedTestingModule.withState()],
      providers: [
        { provide: EntityFormService, useValue: mockFormService },
        { provide: MAT_DIALOG_DATA, useValue: detailsComponentData },
        {
          provide: MatDialogRef,
          useValue: { backdropClick: () => NEVER, afterClosed: () => NEVER },
        },
      ],
    }).compileComponents();
    spyOn(TestBed.inject(EntityAbility), "cannot").and.returnValue(true);
  }));

  function initComponent() {
    fixture = TestBed.createComponent(RowDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it("should create", fakeAsync(() => {
    initComponent();
    tick();
    expect(component).toBeTruthy();
  }));
});
