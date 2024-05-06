import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DisplayEntityComponent } from "./display-entity.component";

describe("DisplayEntityComponent", () => {
  let component: DisplayEntityComponent;
  let fixture: ComponentFixture<DisplayEntityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisplayEntityComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DisplayEntityComponent);
    component = fixture.componentInstance;
    component.value = [];
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should handle single value and array value", () => {
    component.value = "id-1";
    component.ngOnInit();
    expect(component.entityIds).toEqual(["id-1"]);

    component.value = ["id-1", "id-2"];
    component.ngOnInit();
    expect(component.entityIds).toEqual(["id-1", "id-2"]);
  });
});
