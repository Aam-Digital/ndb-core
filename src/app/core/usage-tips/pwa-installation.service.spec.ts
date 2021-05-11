import { TestBed } from "@angular/core/testing";

import { PwaInstallationService } from "./pwa-installation.service";

describe("PwaInstallationService", () => {
  let service: PwaInstallationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PwaInstallationService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
