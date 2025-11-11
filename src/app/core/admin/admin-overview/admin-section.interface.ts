import { MenuItem } from "../../ui/navigation/menu-item";

export interface AdminSection {
  id: string;
  title: string;
  description?: string;
  expanded?: boolean;
  items: MenuItem[];
}
