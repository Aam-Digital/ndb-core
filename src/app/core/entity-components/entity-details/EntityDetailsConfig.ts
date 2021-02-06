import { Entity } from "../../entity/entity";

export class EntityDetailsConfig {
  icon: string;
  entity: string;
  panels: Panel[];
}

export class Panel {
  title: string;
  components: PanelComponent[];
}

export class PanelComponent {
  title: string;
  component: string;
  config?: PanelConfig;
}

export class PanelConfig {
  entity: Entity;
  creatingNew?: boolean;
  config?: any;
}
