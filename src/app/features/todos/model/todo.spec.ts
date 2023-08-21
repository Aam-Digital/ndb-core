import { Todo } from "./todo";
import { testEntitySubclass } from "../../../core/entity/model/entity.spec";
import moment from "moment";

describe("Todo", () => {
  testEntitySubclass("Todo", Todo, {
    _id: "Todo:some-id",

    subject: "new task",
    deadline: "2022-12-01",
    description: "details of the task",
    assignedTo: ["demo"],
    relatedEntities: [],
  });

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
