import { testEntitySubclass } from "../entity/model/entity.spec";
import { Config } from "./config";

// TODO active this once User Roles PR is merged, currently config has wrong constructor parameters
xdescribe("Config", () => {
  testEntitySubclass("Config", Config, {
    _id: "Config:" + Config.CONFIG_KEY,
    data: {
      some: "data",
      without: "structure",
    },
  });
});
