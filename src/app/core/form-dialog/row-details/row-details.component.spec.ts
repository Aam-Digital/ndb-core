import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import {
  DetailsComponentData,
  RowDetailsComponent,
} from "./row-details.component";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { Entity } from "../../entity/model/entity";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { EntityAbility } from "../../permissions/ability/entity-ability";
import { NEVER } from "rxjs";
import { EntityFormService } from "../../common-components/entity-form/entity-form.service";
import { EntityForm } from "#src/app/core/common-components/entity-form/entity-form";
import { FormBuilder } from "@angular/forms";

describe("RowDetailsComponent", () => {
  let component: RowDetailsComponent;
  let fixture: ComponentFixture<RowDetailsComponent>;
  let detailsComponentData: DetailsComponentData;

  let mockFormService: any;

  beforeEach(waitForAsync(() => {
    mockFormService = {
      createEntityForm: vi.fn(),
    };
    mockFormService.createEntityForm.mockReturnValue(
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
    vi.spyOn(TestBed.inject(EntityAbility), "cannot").mockReturnValue(true);
  }));

  function initComponent() {
    fixture = TestBed.createComponent(RowDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it("should create", async () => {
    vi.useFakeTimers();
    try {
      initComponent();
      await vi.advanceTimersByTimeAsync(0);
      expect(component).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });
});
