import { pickupables, placeables } from "./objects/selectables";

export type GameState = {
  _paused: boolean;
  _done: boolean;
  _selectedItem: keyof typeof placeables | keyof typeof pickupables | null;
}