import assetLibrary from "../core/asset_library";
import { Sprite } from "../core/sprite";
import { utils, Vec } from "../core/utils";

export type Placement = {
  _texture: number[][];
  _position: Vec;
  _scale: Vec;
  _sprite?: Sprite;
  _placed?: boolean;
  _placements?: Sprite | null;
};

export type LevelData = {
  _wandAvailable: boolean;
  _swatterAvailable: boolean;
  _flySpawnRate: number;
  _baseCrazyMod: number
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

export const createState = (levelData: LevelData) => {
  return {
    _paused: false,
    _done: false,
    _selectedItem: null as string | null,
    _dizzyness: 0.002,
    _crazyness: 0,
    _levelData: levelData as LevelData,
    _placements: [
      { _texture: assetLibrary._textures._utensil_knife, _position: <Vec>[0.62, 0.55], _scale: <Vec>[0.32, 0.32], _placed: false, _sprite: null as Sprite | null },
      { _texture: assetLibrary._textures._utensil_fork, _position: <Vec>[0.38, 0.55], _scale: <Vec>[-0.3, 0.3], _placed: false, _sprite: null as Sprite | null },

      { _texture: assetLibrary._textures._utensil_fork, _position: <Vec>[0.66, 0.675], _scale: <Vec>[0.3, 0.3], _placed: false, _sprite: null as Sprite | null },
      { _texture: assetLibrary._textures._utensil_knife, _position: <Vec>[0.34, 0.675], _scale: <Vec>[-0.32, 0.32], _placed: false, _sprite: null as Sprite | null },

      { _texture: assetLibrary._textures._utensil_plate, _position: <Vec>[0.64, 0.6], _scale: <Vec>[0.4, 0.3], _placed: false, _sprite: null as Sprite | null },
      { _texture: assetLibrary._textures._utensil_plate, _position: <Vec>[0.36, 0.6], _scale: <Vec>[-0.4, 0.3], _placed: false, _sprite: null as Sprite | null },

      { _texture: assetLibrary._textures._utensil_glass, _position: <Vec>[0.45, 0.59], _scale: <Vec>[0.2, 0.2], _placed: false, _sprite: null as Sprite | null },
      { _texture: assetLibrary._textures._utensil_glass, _position: <Vec>[0.55, 0.59], _scale: <Vec>[-0.2, 0.2], _placed: false, _sprite: null as Sprite | null },
    ] as Array<Placement>,
    _placeables: placeables,
    _pickupables: pickupables,
  }
}

export type GameState = ReturnType<typeof createState>;

export const getClosestFreePlacement = (state: GameState, texture: number[][], coord: Vec): Placement | null => {
  let closest: Placement | null = null;
  for (const placement of state._placements) {
    if (!placement._placed && placement._texture === texture) {
      const dist = utils._simpleDistance(coord, placement._position);
      if (!closest || dist < utils._simpleDistance(coord, placement._position)) {
        closest = placement;
      }
    }
  }

  return closest;
}