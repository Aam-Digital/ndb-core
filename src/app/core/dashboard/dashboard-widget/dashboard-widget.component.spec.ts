import { ComponentFixture, TestBed } from "@angular/core/testing";

import { DashboardWidgetComponent } from "./dashboard-widget.component";
import { FaDynamicIconComponent } from "../../common-components/fa-dynamic-icon/fa-dynamic-icon.component";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("DashboardWidgetComponent", () => {
  let component: DashboardWidgetComponent;
  let fixture: ComponentFixture<DashboardWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FaDynamicIconComponent,
        FontAwesomeTestingModule,
        DashboardWidgetComponent,
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardWidgetComponent);
    component = fixture.componentInstance;
    component.icon = "child";
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
