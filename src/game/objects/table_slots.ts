import createSprite, { Sprite, SpriteUpdater } from "../../core/sprite";
import { utils } from "../../core/utils";
import { Placement } from "../state";
import { createBurst } from "./fx";

const flyOffUpdater = (toLeft = true): SpriteUpdater => {
  let rand = utils._rndRange(-0.1, 0.1);
  let elapsed = 0;
  const duration = 0.5;

  return (sprite, _, delta) => {
    elapsed = elapsed + delta;

    sprite._position[0] += (delta * 0.5) * (toLeft ? -1 : 1);
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
  const previouslyPlaced: Map<Placement, boolean> = new Map();

  base._updater = (_, game, delta) => {
    if (!initialized) {
      initialized = true;
      for (const placement of game._state._placements) {
        const obj = createSprite(placement._texture, [...placement._position], placement._scale);
        obj._opacity = 0;
        placement._sprite = obj;
        base._addChild(obj);
      }
    }

    for (const placement of game._state._placements) {
      if (placement._placed && !previouslyPlaced.get(placement)) {
        placement._sprite!._updater = () => { };
        placement._sprite!._angle = 0;
        placement._sprite!._opacity = 1;
        placement._sprite!._position = [...placement._position];
      } else if (!placement._placed && previouslyPlaced.get(placement)) {
        base._addChild(createBurst(base, placement._position));
        placement._sprite!._position = [...placement._position];
        placement._sprite!._updater = flyOffUpdater(placement._position[0] < 0.5);
      }

      previouslyPlaced.set(placement, placement._placed || false);
    }
  };

  return base;
}