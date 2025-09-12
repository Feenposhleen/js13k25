import assetLibrary from "../../core/asset_library";
import createSprite, { Sprite, SpriteUpdater } from "../../core/sprite";
import { utils, Vec } from "../../core/utils";
import { LevelData } from "../state";

export const createCatHead = (parentSprite: Sprite, levelData: LevelData) => {
  var _lookAtCoordinates: Vec | null;
  const _eyes: Array<Sprite> = [];
  const _globalEyeOffset: Vec = [0, 0];

  const catHeadSprite = createSprite(assetLibrary._textures._catface, [0, 0], [0.8, 0.8], 1, 0.3);
  catHeadSprite._updater = (sprite, game, _) => {
    sprite._position = [
      0.01 * (utils._sin(game._worker._ticks * 10 * levelData._baseCrazyMod)),
      sprite._position[1],
    ];
  };


  for (let i = 0; i < 2; i++) {
    const mult = i ? 1 : -1;
    const eyeSprite = createSprite(
      assetLibrary._textures._cateye_white,
      [0.045 * mult, -0.03],
      [0.12 * mult, 0.12],
      1,
    );


    eyeSprite._updater = (sprite, game, __) => {
      const blink = (utils._sin(game._worker._ticks * 1.5) + 1) / 2;
      sprite._scale[1] = 0.12 * (blink > 0.98 ? 0.1 : 1);
    };

    const pupilSprite = createSprite(
      assetLibrary._textures._cateye_center,
      [0, 0],
      [0.8, 0.8],
    );

    pupilSprite._updater = (sprite, state, delta) => {
      const targetWorld = [...(_lookAtCoordinates || state._input._pointer._coord)] as Vec;
      const eyeWorld = utils._resolvePosition(parentSprite, eyeSprite);

      const dist = utils._simpleDistance(eyeWorld, targetWorld);
      const angle = utils._vectorAngle(eyeWorld, targetWorld);

      const targetPos: Vec = [
        utils._cos(angle) * 0.2 * dist * ((eyeSprite._scale[0] || 1) < 0 ? -1 : 1),
        utils._sin(angle) * 0.2 * dist,
      ];

      sprite._position = utils._dampenedApproach(sprite._position, targetPos, delta * 10);
    };

    eyeSprite._addChild(pupilSprite);
    catHeadSprite._addChild(eyeSprite);
    _eyes.push(eyeSprite);
  }

  const _lookAt = async (coord: Vec | null): Promise<void> => {
    const headGlobalPosition = utils._resolvePosition(parentSprite, catHeadSprite);
    _globalEyeOffset[0] = headGlobalPosition[0];
    _globalEyeOffset[1] = headGlobalPosition[1];
    _lookAtCoordinates = coord;
  }

  return {
    _sprite: catHeadSprite,
    _lookAt,
  };
}