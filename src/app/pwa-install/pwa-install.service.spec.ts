import { TestBed } from "@angular/core/testing";
import { PwaInstallModule } from "./pwa-install.module";

import { PwaInstallService } from "./pwa-install.service";

describe("PwaInstallService", () => {
  let service: PwaInstallService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PwaInstallModule],
    });
    service = TestBed.inject(PwaInstallService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
