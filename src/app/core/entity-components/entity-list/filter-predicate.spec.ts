import { Note } from "../../../child-dev-project/notes/model/note";
import { defaultInteractionTypes } from "../../config/default-config/default-interaction-types";
import { entityFilterPredicate } from "./filter-predicate";

describe("filterPredicate", () => {
  it("should match configurable enum objects", () => {
    const note = new Note();
    note.category = defaultInteractionTypes.find((it) => it.id === "VISIT");

    const match = entityFilterPredicate(note, "home");
    expect(match).toBeTrue();
  });
});
