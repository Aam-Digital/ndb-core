import { Todo } from "./todo";
import { testEntitySubclass } from "../../../core/entity/model/entity.spec";

describe("Todo", () => {
  testEntitySubclass("Todo", Todo, {
    _id: "Todo:some-id",

    subject: "new task",
    deadline: new Date("2022-12-01"),
    description: "details of the task",
    assignedTo: ["demo"],
    relatedEntities: [],

    searchIndices: ["new", "task"],
  });
});
