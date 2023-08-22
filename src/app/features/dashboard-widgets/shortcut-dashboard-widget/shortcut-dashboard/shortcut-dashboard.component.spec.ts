import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ShortcutDashboardComponent } from "./shortcut-dashboard.component";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { EntityMapperService } from "../../../../core/entity/entity-mapper/entity-mapper.service";

describe("ShortcutDashboardComponent", () => {
  let component: ShortcutDashboardComponent;
  let fixture: ComponentFixture<ShortcutDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShortcutDashboardComponent, FontAwesomeTestingModule],
      providers: [{ provide: EntityMapperService, useValue: undefined }],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ShortcutDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
