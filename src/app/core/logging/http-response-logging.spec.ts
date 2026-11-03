import { HttpStatusCode } from "@angular/common/http";
import { describeResponse } from "./http-response-logging";

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
