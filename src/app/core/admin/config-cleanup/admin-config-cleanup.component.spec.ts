import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { AdminConfigCleanupComponent } from "./admin-config-cleanup.component";
import { ConfigurableEnumCleanupComponent } from "./configurable-enum-cleanup/configurable-enum-cleanup.component";

@Component({
  selector: "app-configurable-enum-cleanup",
  template: "",
})
class MockConfigurableEnumCleanupComponent {}

describe("AdminConfigCleanupComponent", () => {
  let fixture: ComponentFixture<AdminConfigCleanupComponent>;
  let component: AdminConfigCleanupComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminConfigCleanupComponent, FontAwesomeTestingModule],
    })
      .overrideComponent(AdminConfigCleanupComponent, {
        remove: {
          imports: [ConfigurableEnumCleanupComponent],
        },
        add: {
          imports: [MockConfigurableEnumCleanupComponent],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(AdminConfigCleanupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
