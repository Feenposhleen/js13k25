import assetLibrary from "../../core/asset_library";
import createSprite, { Sprite, SpriteUpdater } from "../../core/sprite";
import { utils } from "../../core/utils";
import { LevelData } from "../state";
import { createCatHead } from "./cat_head";

export const createCat = (levelData: LevelData) => {
  const catBodySprite = createSprite(assetLibrary._textures._catbody, [0, 0], [1, 1]);
  const catHead = createCatHead(catBodySprite, levelData);
  const catPawSprite = createSprite(assetLibrary._textures._catpaw, [-0.06, 0], [1.2, 1.2], 1, 3);
  let ongoingAttack: Promise<void> | null = null;

  const readyUpdater: SpriteUpdater = (sprite, game, delta) => {
    sprite._scale = [1.2, 1.2];
    sprite._position = [-0.06, 0];
    sprite._angle = 3 + (0.1 * utils._sin(game._worker._ticks * 3));
  };

  const chillUpdater: SpriteUpdater = (sprite, game, delta) => {
    sprite._scale = [0.9, 0.9];
    sprite._position = [-0.06, 0];
    sprite._angle = (0.1 * utils._sin(game._worker._ticks * 1));
  }

  const createAttackUpdater = (toTheLeft: boolean): SpriteUpdater => {
    return (sprite, game, delta) => {
      sprite._scale = [0.9, 3];
      sprite._position = [-0.04, 0.05];
      sprite._angle = (-0.2 + (toTheLeft ? 1.2 : -0.7) + (utils._sin(game._worker._ticks * 20)) * 0.2);
    };
  }

  catPawSprite._updater = chillUpdater;

  const attackCycle = async (toTheLeft: boolean) => Promise.all([
    utils._tweenUpdater(catPawSprite, readyUpdater, 0.5),
    catHead._lookAt([toTheLeft ? 0.2 : 0.8, 0.9]),
  ])
    .then(() => utils._wait(1 + utils._rndFloat() * 2))
    .then(() => utils._tweenUpdater(catPawSprite, createAttackUpdater(toTheLeft), 0.4, (game) => {
      for (const placement of game._state._placements) {
        if (placement._placed && (toTheLeft && placement._position[0] < 0.5) || (!toTheLeft && placement._position[0] >= 0.5)) {
          placement._placed = false;
        }
      }
    }))
    .then(() => utils._wait(1 + utils._rndFloat()))
    .then(() => Promise.all([
      utils._tweenUpdater(catPawSprite, chillUpdater, 0.2),
    ]))
    .then(async (): Promise<void> => {
      catHead._lookAt(null);
      ongoingAttack = null;
    });


  catBodySprite._updater = (sprite, game, delta) => {
    if (game._state._crazyness > 0.5 && !ongoingAttack) {
      ongoingAttack = attackCycle(utils._rndBool()).then(() => { game._state._crazyness = utils._clamp(game._state._crazyness - 0.3, 0, 1); });
    }
  };

  catBodySprite._addChild(catPawSprite);
  catBodySprite._addChild(catHead._sprite);

  return catBodySprite;
}