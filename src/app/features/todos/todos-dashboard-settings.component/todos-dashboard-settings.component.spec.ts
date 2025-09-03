import { ComponentFixture, TestBed } from "@angular/core/testing";

import { TodosDashboardSettingsComponent } from "./todos-dashboard-settings.component";

describe("TodosDashboardSettingsComponent", () => {
  let component: TodosDashboardSettingsComponent;
  let fixture: ComponentFixture<TodosDashboardSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TodosDashboardSettingsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TodosDashboardSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
