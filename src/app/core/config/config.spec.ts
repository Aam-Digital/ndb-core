import { testEntitySubclass } from "../entity/model/entity.spec";
import { Config } from "./config";

describe("Config", () => {
  testEntitySubclass("Config", Config, {
    _id: "Config:" + Config.CONFIG_KEY,
    data: {
      some: "data",
      without: "structure",
    },
  });
});
