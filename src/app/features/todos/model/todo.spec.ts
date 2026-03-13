import { Todo } from "./todo";
import moment from "moment";

describe("Todo", () => {
  it("should infer isOverdue", () => {
    expect(Todo.create({}).isOverdue, "empty").toBe(false);

    expect(
      Todo.create({
        deadline: moment().subtract(1, "day").toDate(),
      }).isOverdue,
      "deadline passed",
    ).toBe(true);

    expect(
      Todo.create({
        deadline: moment().subtract(1, "day").toDate(),
        completed: { completedAt: new Date(), completedBy: null },
      }).isOverdue,
      "completed deadline",
    ).toBe(false);
  });
});
