import assetLibrary from "../core/asset_library";
import { Sprite } from "../core/sprite";
import { utils, Vec } from "../core/utils";
import { Slot } from "./objects/table_slots";

export type LevelData = {
  _wandAvailable: boolean;
  _swatterAvailable: boolean;
  _flySpawnRate: number;
  _baseCrazyMod: number
}

export type LevelState = {
  _levelData: LevelData;
  _selectedItem: string | null;
  _dizzyness: number;
  _crazyness: number;
  _placedItems: Map<Slot, boolean>;
}

export const placeables = {
  _fork: assetLibrary._textures._utensil_fork,
  _knife: assetLibrary._textures._utensil_knife,
  _glass: assetLibrary._textures._utensil_glass,
  _plate: assetLibrary._textures._utensil_plate,
}

export const pickupables = {
  _wand: assetLibrary._textures._pickup_wand,
  _swatter: assetLibrary._textures._pickup_swatter,
}

export const createState = () => {
  return {
    _paused: false,
    _levelState: null as LevelState | null,
    _done: false,
    _selectedItem: null as string | null,
    _dizzyness: 0.002,
    _crazyness: 0,
    _placedItems: {} as Record<string, number[][]>,
    _placeables: placeables,
    _pickupables: pickupables,
  }
}

export type GameState = ReturnType<typeof createState>;
