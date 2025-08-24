import assetLibrary from "../../core/asset_library";
import createSprite from "../../core/sprite";

export const createCat = () => {
  var _ticks = 0;

  const catBodySprite = createSprite(assetLibrary._textures._catbody, [0, -10], [.5, .5]);
  catBodySprite._setUpdater((sprite, state, delta) => {
    _ticks += delta;
  });

  const catFaceSprite = createSprite(assetLibrary._textures._catface, [60, -10], [0.8, 0.8], 1, 0.3);
  catFaceSprite._setUpdater((sprite, state, delta) => {
    sprite._position = [
      5 + (10 * Math.sin(_ticks * 2)),
      sprite._position[1],
    ];
  });

  var eyes = [];
  for (let i = 0; i < 2; i++) {
    const mult = i ? 1 : -1;
    const eyeSprite = createSprite(assetLibrary._textures._cateye_white, [34 * mult, -20], [0.12 * mult, 0.12], 1);
    // eye blinks every 3 seconds
    eyeSprite._setUpdater((sprite, state, delta) => {
      const blink = (Math.sin(_ticks * 2) + 1) / 2;
      sprite._scale[1] = 0.12 * (blink > 0.98 ? 0.1 : 1);
    });

    const pupilSprite = createSprite(assetLibrary._textures._cateye_center, [0, 0], [0.8, 0.8]);
    pupilSprite._setUpdater((sprite, state, delta) => {
      sprite._position = [
        24 * (mult * Math.sin(-_ticks * 2)),
        sprite._position[1],
      ];
    });

    eyeSprite._addChild(pupilSprite);
    catFaceSprite._addChild(eyeSprite);
    eyes.push(eyeSprite);
  }

  const catPawSprite = createSprite(assetLibrary._textures._catpaw, [-40, 30], [1.2, 1.2], 1, 3);
  // Rotate the paw back and forth slightly
  catPawSprite._setUpdater((sprite, state, delta) => {
    sprite._angle = 3 + (0.1 * Math.sin(_ticks * 3));
  });

  catBodySprite._addChild(catPawSprite);
  catBodySprite._addChild(catFaceSprite);

  return catBodySprite;
}