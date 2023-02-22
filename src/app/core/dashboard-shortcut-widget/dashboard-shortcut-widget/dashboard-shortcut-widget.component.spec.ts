import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DashboardShortcutWidgetComponent } from "./dashboard-shortcut-widget.component";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { EntityMapperService } from "../../entity/entity-mapper.service";

describe("ShortcutDashboardWidgetComponent", () => {
  let component: DashboardShortcutWidgetComponent;
  let fixture: ComponentFixture<DashboardShortcutWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardShortcutWidgetComponent, FontAwesomeTestingModule],
      providers: [{ provide: EntityMapperService, useValue: undefined }],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardShortcutWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
