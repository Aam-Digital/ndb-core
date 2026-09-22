import { HttpStatusCode } from "@angular/common/http";
import {
  describeResponse,
  unexpectedResponseMessage,
} from "./http-response-logging";

describe("describeResponse", () => {
  it("should extract fields that JSON.stringify(response) drops", () => {
    const response = new Response("{}", {
      status: HttpStatusCode.TooManyRequests,
      statusText: "Too Many Requests",
    });

    // the behaviour this helper exists to work around
    expect(JSON.stringify(response)).toBe("{}");

    expect(describeResponse(response)).toEqual({
      status: HttpStatusCode.TooManyRequests,
      statusText: "Too Many Requests",
      responseUrl: "",
    });
  });

  it("should include the request method, which the Response does not carry", () => {
    // without it a status cannot be classified: a 409 on a PUT is a rejected
    // save, on a replication checkpoint it is internal housekeeping
    expect(
      describeResponse(
        new Response("{}", { status: HttpStatusCode.Conflict }),
        "PUT",
      ),
    ).toEqual(expect.objectContaining({ method: "PUT" }));
  });

  it("should handle a missing response", () => {
    expect(describeResponse(undefined)).toEqual({});
    // a write that never got a response is the case most in need of the method
    expect(describeResponse(undefined, "PUT")).toEqual({ method: "PUT" });
  });
});

describe("unexpectedResponseMessage", () => {
  it("should name the status, so that monitoring reports one issue per root cause", () => {
    // a number would be masked away by the grouping normalization, merging
    // unrelated failures back into a single issue
    expect(unexpectedResponseMessage(HttpStatusCode.BadRequest)).toBe(
      "Unexpected DB response: bad request",
    );
    expect(unexpectedResponseMessage(HttpStatusCode.PayloadTooLarge)).toBe(
      "Unexpected DB response: payload too large",
    );
  });

  it("should collect statuses without a name into one bucket", () => {
    expect(unexpectedResponseMessage(423)).toBe(
      "Unexpected DB response: unnamed client error",
    );
  });

  it("should not put a digit in the message, which the grouping would mask", () => {
    for (const status of [HttpStatusCode.BadRequest, 423]) {
      expect(unexpectedResponseMessage(status)).not.toMatch(/\d/);
    }
  });
});
