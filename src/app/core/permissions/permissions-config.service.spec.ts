import { TestBed } from "@angular/core/testing";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Subject } from "rxjs";
import { PermissionsConfigService } from "./permissions-config.service";
import { EntityAbility } from "./ability/entity-ability";
import { DatabaseRules } from "./permission-types";
import { Config } from "../config/config";
import { EntityMapperService } from "../entity/entity-mapper/entity-mapper.service";

describe("PermissionsConfigService", () => {
  let service: PermissionsConfigService;
  let mockEntityMapper: {
    load: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };
  let mockAbility: {
    can: ReturnType<typeof vi.fn>;
    on: ReturnType<typeof vi.fn>;
  };
  let mockSnackBar: { open: ReturnType<typeof vi.fn> };
  /** callbacks registered via ability.on("updated", ...) */
  let abilityUpdates: (() => void)[];
  /** emits when the user clicks the snackbar's action button */
  let snackBarAction: Subject<void>;

  beforeEach(() => {
    mockEntityMapper = {
      load: vi.fn().mockName("EntityMapperService.load"),
      save: vi
        .fn()
        .mockName("EntityMapperService.save")
        .mockResolvedValue(undefined),
      remove: vi
        .fn()
        .mockName("EntityMapperService.remove")
        .mockResolvedValue(undefined),
    };
    abilityUpdates = [];
    mockAbility = {
      can: vi.fn().mockReturnValue(true),
      on: vi.fn().mockImplementation((_event, callback) => {
        abilityUpdates.push(callback);
        return () => undefined;
      }),
    };
    snackBarAction = new Subject<void>();
    mockSnackBar = {
      open: vi.fn().mockReturnValue({ onAction: () => snackBarAction }),
    };

    TestBed.configureTestingModule({
      providers: [
        PermissionsConfigService,
        { provide: EntityMapperService, useValue: mockEntityMapper },
        { provide: EntityAbility, useValue: mockAbility },
        { provide: MatSnackBar, useValue: mockSnackBar },
      ],
    });
    service = TestBed.inject(PermissionsConfigService);
  });

  it("should derive the admin check from update access on Config", () => {
    mockAbility.can.mockReturnValue(false);
    expect(service.canManagePermissions()).toBe(false);
    expect(mockAbility.can).toHaveBeenCalledWith("update", Config);

    mockAbility.can.mockReturnValue(true);
    expect(service.canManagePermissions()).toBe(true);
  });

  it("should re-emit the admin check when the user's rules change", () => {
    mockAbility.can.mockReturnValue(false);
    const emitted: boolean[] = [];
    service.canManagePermissions$.subscribe((canManage) =>
      emitted.push(canManage),
    );

    mockAbility.can.mockReturnValue(true);
    abilityUpdates.forEach((callback) => callback());

    expect(emitted).toEqual([false, true]);
  });

  it("should return null when no permissions config exists yet", async () => {
    mockEntityMapper.load.mockRejectedValue({ status: 404 });

    await expect(service.load()).resolves.toBeNull();
  });

  it("should rethrow load failures other than not-found", async () => {
    // a caller must not mistake a temporary failure for "nothing configured yet"
    mockEntityMapper.load.mockRejectedValue(new Error("database unreachable"));

    await expect(service.load()).rejects.toThrow("database unreachable");
  });

  it("should store a timestamped backup before saving the updated rules", async () => {
    const previousRules: DatabaseRules = {
      user_app: [{ subject: "EmailTemplate", action: "read" }],
    };
    const updatedRules: DatabaseRules = {
      user_app: [{ subject: "EmailTemplate", action: "manage" }],
    };
    const config = new Config<DatabaseRules>(
      Config.PERMISSION_KEY,
      previousRules,
    );

    const backup = await service.saveWithBackup(config, updatedRules);

    expect(backup.getId()).toContain(Config.PERMISSION_KEY + ":");
    expect(backup.data).toEqual(previousRules);
    expect(mockEntityMapper.save.mock.calls[0]).toEqual([backup]);
    expect(mockEntityMapper.save.mock.calls[1]).toEqual([config, true]);
    expect(config.data).toEqual(updatedRules);
  });

  it("should restore the backup and delete it when the undo action is used", async () => {
    const stored = new Config<DatabaseRules>(Config.PERMISSION_KEY, {
      user_app: [{ subject: "EmailTemplate", action: "manage" }],
    });
    mockEntityMapper.load.mockResolvedValue(stored);
    const backup = new Config<DatabaseRules>(
      Config.PERMISSION_KEY + ":2026-08-03_10-00-00",
      { user_app: [{ subject: "EmailTemplate", action: "read" }] },
    );

    service.offerUndo(backup, "Permissions updated");
    snackBarAction.next();

    await vi.waitFor(() =>
      expect(mockEntityMapper.remove).toHaveBeenCalledWith(backup),
    );
    expect(stored.data).toEqual(backup.data);
    expect(mockEntityMapper.save).toHaveBeenCalledWith(stored, true);
  });

  it("should keep the backup and warn when the undo itself fails", async () => {
    mockEntityMapper.load.mockRejectedValue(new Error("database unreachable"));
    const backup = new Config<DatabaseRules>(
      Config.PERMISSION_KEY + ":2026-08-03_10-00-00",
      {},
    );

    service.offerUndo(backup, "Permissions updated");
    snackBarAction.next();

    await vi.waitFor(() => expect(mockSnackBar.open).toHaveBeenCalledTimes(2));
    expect(mockEntityMapper.remove).not.toHaveBeenCalled();
  });
});
