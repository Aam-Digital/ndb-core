import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ViewTitleComponent } from "./view-title.component";
import { RouterTestingModule } from "@angular/router/testing";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("ViewTitleComponent", () => {
  let component: ViewTitleComponent;
  let fixture: ComponentFixture<ViewTitleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ViewTitleComponent,
        RouterTestingModule,
        FontAwesomeTestingModule,
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewTitleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
