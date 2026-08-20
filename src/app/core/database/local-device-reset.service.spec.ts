import { TestBed } from "@angular/core/testing";

import { LocalDeviceResetService } from "./local-device-reset.service";
import { ConfirmationDialogService } from "../common-components/confirmation-dialog/confirmation-dialog.service";
import { LOCAL_STORAGE_TOKEN, LOCATION_TOKEN } from "../../utils/di-tokens";
import { RESET_PENDING_KEY } from "#src/bootstrap-reset";

describe("LocalDeviceResetService", () => {
  let service: LocalDeviceResetService;
  const mockLocation = { pathname: "/support" };
  const confirmationDialogMock = { getConfirmation: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.pathname = "/support";

    TestBed.configureTestingModule({
      providers: [
        LocalDeviceResetService,
        {
          provide: ConfirmationDialogService,
          useValue: confirmationDialogMock,
        },
        { provide: LOCATION_TOKEN, useValue: mockLocation },
        { provide: LOCAL_STORAGE_TOKEN, useValue: localStorage },
      ],
    });
    service = TestBed.inject(LocalDeviceResetService);
  });

  afterEach(() => {
    sessionStorage.removeItem(RESET_PENDING_KEY);
    localStorage.clear();
  });

  it("should clear local data and reload after confirmation", async () => {
    confirmationDialogMock.getConfirmation.mockResolvedValue(true);
    localStorage.setItem("someItem", "someValue");

    await service.resetLocalDevice();

    expect(localStorage.getItem("someItem")).toBeNull();
    expect(sessionStorage.getItem(RESET_PENDING_KEY)).toBe("1");
    expect(mockLocation.pathname).toBe("");
  });

  it("should not touch any local data if the user does not confirm", async () => {
    confirmationDialogMock.getConfirmation.mockResolvedValue(false);
    localStorage.setItem("someItem", "someValue");

    await service.resetLocalDevice();

    expect(localStorage.getItem("someItem")).toBe("someValue");
    expect(sessionStorage.getItem(RESET_PENDING_KEY)).toBeNull();
    expect(mockLocation.pathname).toBe("/support");
  });
});
