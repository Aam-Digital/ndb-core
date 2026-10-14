import {
  INTERACTION_TYPE_CONFIG_ID,
  InteractionType,
} from "../../../child-dev-project/notes/model/interaction-type.interface";
import demoEnums from "../../demo-data/demo-enums.json";

// kept separate from the shipped config, whose texts can be configured per language
export const defaultInteractionTypes = demoEnums.find(
  (e) => e._id === "ConfigurableEnum:" + INTERACTION_TYPE_CONFIG_ID,
).values as InteractionType[];
