import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ViewActionsComponent } from "./view-actions.component";
import { RouterTestingModule } from "@angular/router/testing";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("ViewTitleComponent", () => {
  let component: ViewActionsComponent;
  let fixture: ComponentFixture<ViewActionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ViewActionsComponent,
        RouterTestingModule,
        FontAwesomeTestingModule,
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewActionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
