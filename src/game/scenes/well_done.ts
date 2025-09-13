import assetLibrary from "../../core/asset_library";
import createScene from "../../core/scene";
import createSprite from "../../core/sprite";
import { utils, Vec } from "../../core/utils";

export const createWellDone = () => {
  let ticks = 0;
  const scene = createScene();
  scene._updater = (scene, game, delta) => {
    ticks += delta;
  };

  const wellDoneSprite = createSprite(assetLibrary._textures._text_eat, [0.5, 0.5], [1.2, 1.2]);
  wellDoneSprite._updater = (sprite, game, delta) => {
    sprite._angle = utils._sin(ticks * 5) * 0.05;
  };

  scene._rootSprite._addChild(wellDoneSprite);

  return scene;
};