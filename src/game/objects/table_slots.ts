import assetLibrary from "../../core/asset_library";
import createSprite, { Sprite, SpriteUpdater } from "../../core/sprite";
import { utils, Vec } from "../../core/utils";
import { GameState } from "../state";
import { createBurst } from "./fx";

export type Slot = {
  _texture: number[][];
  _position: Vec;
  _scale: Vec;
  _sprite?: Sprite;
};

export const slots = [
  { _texture: assetLibrary._textures._utensil_knife, _position: <Vec>[0.62, 0.55], _scale: <Vec>[0.32, 0.32], _sprite: null as Sprite | null },
  { _texture: assetLibrary._textures._utensil_fork, _position: <Vec>[0.38, 0.55], _scale: <Vec>[-0.3, 0.3], _sprite: null as Sprite | null },

  { _texture: assetLibrary._textures._utensil_fork, _position: <Vec>[0.66, 0.675], _scale: <Vec>[0.3, 0.3], _sprite: null as Sprite | null },
  { _texture: assetLibrary._textures._utensil_knife, _position: <Vec>[0.34, 0.675], _scale: <Vec>[-0.32, 0.32], _sprite: null as Sprite | null },

  { _texture: assetLibrary._textures._utensil_plate, _position: <Vec>[0.64, 0.6], _scale: <Vec>[0.4, 0.3], _sprite: null as Sprite | null },
  { _texture: assetLibrary._textures._utensil_plate, _position: <Vec>[0.36, 0.6], _scale: <Vec>[-0.4, 0.3], _sprite: null as Sprite | null },

  { _texture: assetLibrary._textures._utensil_glass, _position: <Vec>[0.45, 0.59], _scale: <Vec>[0.2, 0.2], _sprite: null as Sprite | null },
  { _texture: assetLibrary._textures._utensil_glass, _position: <Vec>[0.55, 0.59], _scale: <Vec>[-0.2, 0.2], _sprite: null as Sprite | null },
] as Array<Slot>;

export const getClosestFreeSlot = (state: GameState, texture: number[][], coord: Vec): Slot | null => {
  let closest: Slot | null = null;
  for (const slot of slots) {
    if (slot._texture === texture && (!state._levelState!._placedItems.get(slot))) {
      const dist = utils._simpleDistance(coord, slot._position);
      if (!closest || dist < utils._simpleDistance(coord, slot._position)) {
        closest = slot;
      }
    }
  }

  return closest;
}

const flyOffUpdater = (toLeft = true): SpriteUpdater => {
  let rand = utils._rndRange(-0.2, 0.2);
  let elapsed = 0;
  const duration = 0.5;

  return (sprite, _, delta) => {
    elapsed = elapsed + delta;

    sprite._position[0] += (delta * 0.2) * (toLeft ? -1 : 1);
    sprite._angle += rand;
    sprite._opacity = 1 - (elapsed / duration);
    if (elapsed >= duration) {
      sprite._updater = () => { };
    }
  };
}

export const createTableSlots = (): Sprite => {
  var initialized = false;
  const base = createSprite(null, [0, 0]);
  const previouslyPlaced: Map<Slot, boolean> = new Map();

  base._updater = (_, game, delta) => {
    if (!initialized) {
      initialized = true;
      for (const slot of slots) {
        const obj = createSprite(slot._texture, [...slot._position], slot._scale);
        obj._opacity = 0;
        slot._sprite = obj;
        base._addChild(obj);
      }
    }

    for (const slot of slots) {
      if (game._state._levelState!._placedItems.get(slot) && !previouslyPlaced.get(slot)) {
        slot._sprite!._updater = () => { };
        slot._sprite!._angle = 0;
        slot._sprite!._opacity = 1;
        slot._sprite!._position = [...slot._position];
      } else if (!game._state._levelState!._placedItems.get(slot) && previouslyPlaced.get(slot)) {
        base._addChild(createBurst(base, slot._position));
        slot._sprite!._position = [...slot._position];
        slot._sprite!._updater = flyOffUpdater(slot._position[0] < 0.5);
      }

      previouslyPlaced.set(slot, game._state._levelState!._placedItems.get(slot) || false);
    }
  };

  return base;
}