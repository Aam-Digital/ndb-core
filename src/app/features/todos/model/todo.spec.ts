import { Todo } from "./todo";
import moment from "moment";

describe("Todo", () => {
  it("should infer isOverdue", () => {
    expect(Todo.create({}).isOverdue).withContext("empty").toBe(false);

    expect(
      Todo.create({
        deadline: moment().subtract(1, "day").toDate(),
      }).isOverdue,
    )
      .withContext("deadline passed")
      .toBe(true);

    expect(
      Todo.create({
        deadline: moment().subtract(1, "day").toDate(),
        completed: { completedAt: new Date(), completedBy: null },
      }).isOverdue,
    )
      .withContext("completed deadline")
      .toBe(false);
  });
});
