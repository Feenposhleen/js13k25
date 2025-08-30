import assetLibrary from "../../core/asset_library";
import createSprite, { SpriteUpdater } from "../../core/sprite";
import { utils } from "../../core/utils";

export const createCat = () => {
  var _ticks = 0;

  const catBodySprite = createSprite(assetLibrary._textures._catbody, [0, 0], [1, 1]);
  catBodySprite._updater = (_, __, delta) => {
    _ticks += delta;
  };

  const catFaceSprite = createSprite(assetLibrary._textures._catface, [0, 0], [0.8, 0.8], 1, 0.3);
  catFaceSprite._updater = (sprite, _, __) => {
    sprite._position = [
      0.01 + (0.01 * Math.sin(_ticks * 2)),
      sprite._position[1],
    ];
  };

  var eyes = [];
  for (let i = 0; i < 2; i++) {
    const mult = i ? 1 : -1;
    const eyeSprite = createSprite(assetLibrary._textures._cateye_white, [0.045 * mult, -0.03], [0.12 * mult, 0.12], 1);

    eyeSprite._updater = (sprite, _, __) => {
      const blink = (Math.sin(_ticks * 1.5) + 1) / 2;
      sprite._scale[1] = 0.12 * (blink > 0.98 ? 0.1 : 1);
    };

    const pupilSprite = createSprite(assetLibrary._textures._cateye_center, [0, 0], [0.8, 0.8]);

    const chillPupilsUpdater: SpriteUpdater = (sprite, _, __) => {
      sprite._position = [
        0.01 * (mult * Math.sin(-_ticks * 2)),
        sprite._position[1],
      ];
    };

    const followCursorPupilsUpdater: SpriteUpdater = (sprite, state, __) => {
      state._input._pointer._coord

      sprite._position = [
        (state._input._pointer._coord[0] - .5) * 0.1 * mult,
        (state._input._pointer._coord[1] - .5 + .1) * 0.1,
      ];
    };

    pupilSprite._updater = followCursorPupilsUpdater;

    eyeSprite._addChild(pupilSprite);
    catFaceSprite._addChild(eyeSprite);
    eyes.push(eyeSprite);
  }

  const catPawSprite = createSprite(assetLibrary._textures._catpaw, [-0.06, 0], [1.2, 1.2], 1, 3);

  const readyUpdater: SpriteUpdater = (sprite, state, delta) => {
    sprite._scale = [1.2, 1.2];
    sprite._angle = 3 + (0.1 * Math.sin(_ticks * 3));
  };

  const chillUpdater: SpriteUpdater = (sprite, state, delta) => {
    sprite._scale = [0.9, 0.9];
    sprite._angle = (0.1 * Math.sin(_ticks * 1));
  }

  catPawSprite._updater = chillUpdater;

  utils._wait(3).then(() => utils._tweenUpdater(catPawSprite, readyUpdater, 0.2));

  catBodySprite._addChild(catPawSprite);
  catBodySprite._addChild(catFaceSprite);

  return catBodySprite;
}