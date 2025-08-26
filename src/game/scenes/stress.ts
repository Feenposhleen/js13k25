import assetLibrary from "../../core/asset_library";
import createScene, { Scene } from "../../core/scene";
import createSprite from "../../core/sprite";
import { createCat } from "../objects/cat";

export const createStressScene = () => {
  var _ticks = 0;

  const stressScene = createScene((scene, state, delta) => {
    _ticks += delta;
  });

  const anchorSprite = createSprite(null, [0.5, 0.5]);


  for (let i = 0; i < 500; i++) {
    const cat = createCat();
    const oldUpdater = cat._updater;
    cat._updater = ((sprite, state, delta) => {
      oldUpdater(sprite, state, delta);
      sprite._position[0] = 0.5 * Math.sin(_ticks * 0.5 + i);
      sprite._position[1] = 0.5 * Math.cos(_ticks * 0.5 + i * 1.1) - 0.3;
      sprite._angle = 0.1 * Math.sin(_ticks * 2 + i);
    });

    anchorSprite._addChild(cat);
  }

  stressScene._rootSprite._addChild(anchorSprite);
  return stressScene;
}