import assetLibrary from "../../core/asset_library";
import createSprite, { Sprite, SpriteUpdater } from "../../core/sprite";
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
      0.01 + (0.01 * utils._sin(_ticks * 2)),
      sprite._position[1],
    ];
  };

  const createFocusPupilsUpdater = (toTheLeft: boolean): SpriteUpdater => {
    return (sprite, _, __) => {
      sprite._scale = [1, 1];
      sprite._position = [
        (0.06 * (toTheLeft ? -1 : 1)),
        0.05,
      ];
    };
  };

  const createFollowCursorPupilsUpdater = (leftEye: boolean): SpriteUpdater => (sprite, state, __) => {
    sprite._scale = [.8, .8];
    sprite._position = [
      (state._input._pointer._coord[0] - .5) * 0.1 * (leftEye ? -1 : 1),
      (state._input._pointer._coord[1] - .5 + .1) * 0.1,
    ];
  };

  var eyes: Array<Sprite> = [];
  for (let i = 0; i < 2; i++) {
    const mult = i ? 1 : -1;
    const eyeSprite = createSprite(assetLibrary._textures._cateye_white, [0.045 * mult, -0.03], [0.12 * mult, 0.12], 1);

    eyeSprite._updater = (sprite, _, __) => {
      const blink = (utils._sin(_ticks * 1.5) + 1) / 2;
      sprite._scale[1] = 0.12 * (blink > 0.98 ? 0.1 : 1);
    };

    const pupilSprite = createSprite(assetLibrary._textures._cateye_center, [0, 0], [0.8, 0.8]);

    pupilSprite._updater = createFollowCursorPupilsUpdater(i === 0);

    eyeSprite._addChild(pupilSprite);
    catFaceSprite._addChild(eyeSprite);
    eyes.push(eyeSprite);
  }

  const catPawSprite = createSprite(assetLibrary._textures._catpaw, [-0.06, 0], [1.2, 1.2], 1, 3);

  const readyUpdater: SpriteUpdater = (sprite, state, delta) => {
    sprite._scale = [1.2, 1.2];
    sprite._position = [-0.06, 0];
    sprite._angle = 3 + (0.1 * utils._sin(_ticks * 3));
  };

  const chillUpdater: SpriteUpdater = (sprite, state, delta) => {
    sprite._scale = [0.9, 0.9];
    sprite._position = [-0.06, 0];
    sprite._angle = (0.1 * utils._sin(_ticks * 1));
  }

  const createAttackUpdater = (toTheLeft: boolean): SpriteUpdater => {
    return (sprite, state, delta) => {
      sprite._scale = [0.9, 3];
      sprite._position = [-0.04, 0.05];
      sprite._angle = (-0.2 + (toTheLeft ? -0.7 : 1.2) + (utils._sin(_ticks * 20)) * 0.2);
    };
  }

  catPawSprite._updater = chillUpdater;

  const lookTowards = (left: boolean): Promise<void[]> => {
    const promises: Array<Promise<void>> = [];
    for (var i = 0; i < eyes.length; i++) {
      promises.push(utils._tweenUpdater(eyes[i]._children[0], createFocusPupilsUpdater(i + (left ? 0 : -1) === 0), 0.2));
    }

    return Promise.all(promises);
  }

  const attackCycle = async (toTheLeft: boolean) => utils._wait(utils._rndRange(3, 9))
    .then(() => Promise.all([
      utils._tweenUpdater(catPawSprite, readyUpdater, 0.5),
      lookTowards(toTheLeft),
    ]))
    .then(() => utils._wait(1 + utils._rndFloat() * 2))
    .then(() => utils._tweenUpdater(catPawSprite, createAttackUpdater(toTheLeft), 0.4, (game) => {
      for (const placement of game._state._placements) {
        if (placement._placed && (toTheLeft && placement._position[0] > 0.5) || (!toTheLeft && placement._position[0] <= 0.5)) {
          placement._placed = false;
        }
      }
    }))
    .then(() => utils._wait(1 + utils._rndFloat()))
    .then(() => Promise.all([
      utils._tweenUpdater(catPawSprite, chillUpdater, 0.2),
      utils._tweenUpdater(eyes[0]._children[0], createFollowCursorPupilsUpdater(true), 0.2),
      utils._tweenUpdater(eyes[1]._children[0], createFollowCursorPupilsUpdater(false), 0.2),
    ]))
    .then(() => { attackCycle(!toTheLeft) });

  attackCycle(true);

  catBodySprite._addChild(catPawSprite);
  catBodySprite._addChild(catFaceSprite);

  return catBodySprite;
}