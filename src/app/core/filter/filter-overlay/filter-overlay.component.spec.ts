import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { FilterOverlayComponent } from "./filter-overlay.component";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { TestEntity } from "../../../utils/test-utils/TestEntity";

describe("FilterOverlayComponent", () => {
  let component: FilterOverlayComponent<any>;
  let fixture: ComponentFixture<FilterOverlayComponent<any>>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [FilterOverlayComponent, MockedTestingModule.withState()],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            filterConfig: [],
            entityType: TestEntity,
            entities: [],
            useUrlQueryParams: false,
            filterObjChange: vi.fn(),
          },
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FilterOverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
