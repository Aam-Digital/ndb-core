import { Entity } from "../../entity/entity";

export interface EntityDetailsConfig {
  icon: string;
  entity: string;
  panels: Panel[];
}

export interface Panel {
  title: string;
  components: PanelComponent[];
}

export interface PanelComponent {
  title: string;
  component: string;
  config?: PanelConfig;
}

export interface PanelConfig {
  entity: Entity;
  creatingNew?: boolean;
  config?: any;
}
