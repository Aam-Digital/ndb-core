import {
  INTERACTION_TYPE_CONFIG_ID,
  InteractionType,
} from "../../../child-dev-project/notes/model/interaction-type.interface";
import enums from "../../../../assets/base-configs/education/configurable-enums.json";

export const defaultInteractionTypes = enums.find(
  (e) => e._id === "ConfigurableEnum:" + INTERACTION_TYPE_CONFIG_ID,
).values as InteractionType[];
