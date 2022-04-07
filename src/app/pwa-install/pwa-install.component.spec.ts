import { ComponentFixture, TestBed } from "@angular/core/testing";

import { PwaInstallComponent } from "./pwa-install.component";
import { PwaInstallModule } from "./pwa-install.module";

describe("PwaInstallComponent", () => {
  let component: PwaInstallComponent;
  let fixture: ComponentFixture<PwaInstallComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PwaInstallModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PwaInstallComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
