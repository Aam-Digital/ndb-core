import { ComponentFixture, TestBed } from "@angular/core/testing";
import { EditPublicformRouteComponent } from "./edit-publicform-route.component";
import { FormControl } from "@angular/forms";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";

describe("EditPublicformRouteComponent", () => {
  let component: EditPublicformRouteComponent;
  let fixture: ComponentFixture<EditPublicformRouteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditPublicformRouteComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(EditPublicformRouteComponent);
    component = fixture.componentInstance;
    component.formControl = new FormControl();
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
