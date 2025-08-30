import assetLibrary from "../core/asset_library";
import { Sprite } from "../core/sprite";
import { utils, Vec } from "../core/utils";
import { pickupables, placeables } from "./objects/selectables";

export type Placement = {
  _texture: number[][];
  _position: Vec;
  _scale: Vec;
  _sprite?: Sprite;
  _placed?: boolean;
};

export type GameState = {
  _paused: boolean;
  _done: boolean;
  _selectedItem: keyof typeof placeables | keyof typeof pickupables | null;
  _placements: Array<Placement>;
}

export const createInitialState = (): GameState => {
  return {
    _paused: false,
    _done: false,
    _selectedItem: null,
    _placements: [
      { _texture: assetLibrary._textures._utensil_knife, _position: [0.62, 0.55], _scale: [0.32, 0.32] },
      { _texture: assetLibrary._textures._utensil_fork, _position: [0.38, 0.55], _scale: [-0.3, 0.3] },

      { _texture: assetLibrary._textures._utensil_fork, _position: [0.66, 0.675], _scale: [0.3, 0.3] },
      { _texture: assetLibrary._textures._utensil_knife, _position: [0.34, 0.675], _scale: [-0.32, 0.32] },

      { _texture: assetLibrary._textures._utensil_plate, _position: [0.64, 0.6], _scale: [0.4, 0.3] },
      { _texture: assetLibrary._textures._utensil_plate, _position: [0.36, 0.6], _scale: [-0.4, 0.3] },

      { _texture: assetLibrary._textures._utensil_glass, _position: [0.45, 0.59], _scale: [0.2, 0.2] },
      { _texture: assetLibrary._textures._utensil_glass, _position: [0.55, 0.59], _scale: [-0.2, 0.2] },
    ],
  }
}

export const getClosestFreePlacement = (state: GameState, texture: number[][], coord: Vec): Placement | null => {
  let closest: Placement | null = null;
  for (const placement of state._placements) {
    if (!placement._placed && placement._texture === texture) {
      const dist = utils._vectorDistance(coord, placement._position);
      if (!closest || dist < utils._vectorDistance(coord, placement._position)) {
        closest = placement;
      }
    }
  }

  return closest;
}