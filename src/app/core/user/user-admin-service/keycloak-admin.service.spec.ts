import { TestBed } from "@angular/core/testing";
import {
  HttpClientTestingModule,
  HttpTestingController,
} from "@angular/common/http/testing";
import { KeycloakAdminService } from "./keycloak-admin.service";
import { environment } from "../../../../environments/environment.spec";
import { Role } from "./user-account";
import { UserAdminApiError } from "./user-admin.service";
import { Logging } from "app/core/logging/logging.service";

describe("KeycloakAdminService", () => {
  let service: KeycloakAdminService;
  let httpTestingController: HttpTestingController;

  const BASE_URL = `${environment.userAdminApi}/admin/realms/${environment.realm}`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [KeycloakAdminService],
    });

    service = TestBed.inject(KeycloakAdminService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should delete user", async () => {
    // when
    service.deleteUser("test-entity-id").subscribe((response) => {
      expect(response.userDeleted).toBe(true);
    });

    // then
    const reqGet = httpTestingController.expectOne(
      `${BASE_URL}/users?q=exact_username:test-entity-id&exact=true`,
    );
    expect(reqGet.request.method).toEqual("GET");
    reqGet.flush([{ id: "test-id" }]);

    httpTestingController
      .expectOne(
        `http://localhost:8080/admin/realms/test-realm/users/test-id/role-mappings/realm`,
      )
      .flush([]);

    const reqDelete = httpTestingController.expectOne(
      `${BASE_URL}/users/test-id`,
    );
    expect(reqDelete.request.method).toEqual("DELETE");
    reqDelete.flush({});
  });

  it("should create user", async () => {
    // given
    const mockUser = { id: "test-id", email: "test@example.com" };

    // when
    service
      .createUser("test-entity-id", "test@example.com", [])
      .subscribe((user) => {
        expect(user).toEqual(
          expect.objectContaining({ email: "test@example.com" }),
        );
      });

    // then
    const reqPost = httpTestingController.expectOne(`${BASE_URL}/users`);
    expect(reqPost.request.method).toEqual("POST");
    reqPost.flush(mockUser);

    httpTestingController
      .expectOne(
        (req) => req.url === `${BASE_URL}/users` && req.method === "GET",
      )
      .flush([mockUser]);

    httpTestingController
      .expectOne(
        (req) =>
          req.url === `${BASE_URL}/users/test-id/role-mappings/realm` &&
          req.method === "POST",
      )
      .flush({});

    const emailReq = httpTestingController.expectOne(
      (req) =>
        req.url === `${BASE_URL}/users/${mockUser.id}/execute-actions-email` &&
        req.method === "PUT",
    );
    // client_id lets Keycloak resolve the app client's baseUrl for the
    // "back to application" link (instead of falling back to the Keycloak account console)
    expect(emailReq.request.params.get("client_id")).toBe("app");
    emailReq.flush({});
  });

  it("should resend invitation email with VERIFY_EMAIL action", async () => {
    service.resendInvitation("test-id").subscribe();

    const emailReq = httpTestingController.expectOne(
      (req) =>
        req.url === `${BASE_URL}/users/test-id/execute-actions-email` &&
        req.method === "PUT",
    );
    expect(emailReq.request.body).toEqual(["VERIFY_EMAIL"]);
    expect(emailReq.request.params.get("client_id")).toBe("app");
    emailReq.flush({});
  });

  it("should log debug if user does not exist in Keycloak during deletion", async () => {
    const warnSpy = vi.spyOn(Logging, "debug");

    service.deleteUser("test-id").subscribe((response) => {
      expect(response.userDeleted).toBe(true);
    });

    const reqGet = httpTestingController.expectOne(
      `${BASE_URL}/users?q=exact_username:test-id&exact=true`,
    );
    expect(reqGet.request.method).toBe("GET");

    reqGet.flush([]);

    expect(warnSpy).toHaveBeenCalledWith("User not found in Keycloak", {
      userEntityId: "test-id",
    });
  });

  it("should throw well-defined error when created user's email already exists", async () => {
    // when
    service
      .createUser("test-entity-id", "test@example.com", [])
      // then
      .subscribe(
        () => fail("Expected error but completed unexpectedly"),
        (err) => {
          expect(err).toBeInstanceOf(UserAdminApiError);
          expect(err.status).toEqual(409);
          expect(err.message).toContain("email");
        },
      );

    const reqPost = httpTestingController.expectOne(`${BASE_URL}/users`);
    expect(reqPost.request.method).toEqual("POST");
    reqPost.flush(
      { errorMessage: "User exists with same email" },
      { status: 409, statusText: "Conflict" },
    );
  });

  it("should update user and send email verification again", async () => {
    // given
    const mockUser = { id: "test-id", email: "test@example.com" };

    // when
    service
      .updateUser("test-id", { email: "new@example.com" })
      .subscribe((result) => {
        expect(result).toEqual({ userUpdated: true });
      });

    // then
    const reqGet = httpTestingController.expectOne(`${BASE_URL}/users/test-id`);
    expect(reqGet.request.method).toEqual("GET");
    reqGet.flush(mockUser);

    const reqPut = httpTestingController.expectOne(`${BASE_URL}/users/test-id`);
    expect(reqPut.request.method).toEqual("PUT");
    reqPut.flush({});

    httpTestingController
      .expectOne(
        (req) =>
          req.url ===
            `${BASE_URL}/users/${mockUser.id}/execute-actions-email` &&
          req.method === "PUT",
      )
      .flush({});
  });

  it("should handle error when updating user", async () => {
    // when
    service
      .updateUser("test-id", { email: "new@example.com" })
      .subscribe((result) => {
        expect(result).toEqual({ userUpdated: false });
      });

    // then
    const reqGet = httpTestingController.expectOne(`${BASE_URL}/users/test-id`);
    expect(reqGet.request.method).toEqual("GET");
    reqGet.flush({ id: "test-id" });

    const reqPut = httpTestingController.expectOne(`${BASE_URL}/users/test-id`);
    expect(reqPut.request.method).toEqual("PUT");
    reqPut.flush(
      { message: "Failed to update user" },
      { status: 500, statusText: "Server Error" },
    );
  });

  it("should get all roles and filter non-technical roles", async () => {
    // given
    const mockRoles: Role[] = [
      { id: "1", name: "admin" },
      { id: "2", name: "user" },
      { id: "3", name: "offline_access" }, // default role to be filtered out
    ];

    // when
    service.getAllRoles().subscribe((roles) => {
      expect(roles).toEqual([mockRoles[0], mockRoles[1]]);
    });

    // then
    const req = httpTestingController.expectOne(`${BASE_URL}/roles`);
    expect(req.request.method).toEqual("GET");
    req.flush(mockRoles);
  });

  it("should handle network error when server is unreachable", async () => {
    service.getAllUsers().subscribe({
      next: () => fail("Should have failed"),
      error: (error) => {
        expect(error).toBeDefined();
      },
    });

    const userReq = httpTestingController.expectOne(`${BASE_URL}/users`);
    expect(userReq.request.method).toEqual("GET");
    userReq.error(new ErrorEvent("Network error"));
  });

  it("should handle permission error (403)", async () => {
    service.getAllUsers().subscribe({
      next: () => fail("Should have failed"),
      error: (error) => {
        expect(error.status).toBe(403);
        expect(error.statusText).toBe("Forbidden");
      },
    });

    const userReq = httpTestingController.expectOne(`${BASE_URL}/users`);
    expect(userReq.request.method).toEqual("GET");
    userReq.flush("Access denied", { status: 403, statusText: "Forbidden" });
  });

  it("should create a realm role", () => {
    let created = false;
    service
      .createRole({ name: "field_supervisor", description: "Supervisors" })
      .subscribe(() => (created = true));

    const req = httpTestingController.expectOne(`${BASE_URL}/roles`);
    expect(req.request.method).toEqual("POST");
    expect(req.request.body).toEqual({
      name: "field_supervisor",
      description: "Supervisors",
    });
    req.flush({});
    expect(created).toBe(true);
  });

  it("should map 409 on role creation to a role-exists error", () => {
    let error: UserAdminApiError;
    service
      .createRole({ name: "existing_role" })
      .subscribe({ error: (err) => (error = err) });

    httpTestingController
      .expectOne(`${BASE_URL}/roles`)
      .flush("conflict", { status: 409, statusText: "Conflict" });

    expect(error).toBeInstanceOf(UserAdminApiError);
    expect(error.status).toBe(409);
  });

  it("should update a realm role description", () => {
    let updated = false;
    service
      .updateRole("field_supervisor", { description: "changed" })
      .subscribe(() => (updated = true));

    const req = httpTestingController.expectOne(
      `${BASE_URL}/roles/field_supervisor`,
    );
    expect(req.request.method).toEqual("PUT");
    expect(req.request.body).toEqual({
      name: "field_supervisor",
      description: "changed",
    });
    req.flush({});
    expect(updated).toBe(true);
  });

  it("should delete a realm role", () => {
    let deleted = false;
    service.deleteRole("field_supervisor").subscribe(() => (deleted = true));

    const req = httpTestingController.expectOne(
      `${BASE_URL}/roles/field_supervisor`,
    );
    expect(req.request.method).toEqual("DELETE");
    req.flush({});
    expect(deleted).toBe(true);
  });

  it("should treat deleting an already-missing role (404) as success", () => {
    let deleted = false;
    service.deleteRole("orphan_role").subscribe(() => (deleted = true));

    const req = httpTestingController.expectOne(
      `${BASE_URL}/roles/orphan_role`,
    );
    req.flush("not found", { status: 404, statusText: "Not Found" });
    expect(deleted).toBe(true);
  });

  it("should handle offline scenario", async () => {
    // Simulate being offline by mocking a network connectivity error
    service.getAllUsers().subscribe({
      next: () => fail("Should have failed"),
      error: (error) => {
        expect(error).toBeDefined();
      },
    });

    const userReq = httpTestingController.expectOne(`${BASE_URL}/users`);
    expect(userReq.request.method).toEqual("GET");
    userReq.error(
      new ErrorEvent("Network error", {
        message: "No internet connection",
      }),
    );
  });
});
