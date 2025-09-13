import assetLibrary from "../../core/asset_library";
import createSprite, { Sprite } from "../../core/sprite";
import { utils } from "../../core/utils";

export const createCrazyBar = (): Sprite => {
  const crazyBar = createSprite(null, [0, 0]);
  let crazyWarnTicker = 0;
  crazyBar._updater = (sprite, game, delta) => {
    game._state._levelState!._crazyness = utils._clamp(game._state._levelState!._crazyness + (delta * game._state._levelState!._levelData._baseCrazyMod * 0.2), 0, 1);

    if (game._state._levelState!._crazyness >= 0.5) {
      crazyWarnTicker += delta;
      if (crazyWarnTicker > 0.5) {
        crazyWarnTicker = 0;
        game._worker._playSfx(2);
      }
    } else {
      crazyWarnTicker = 0;
    }
  }

  const bgSprite = createSprite(assetLibrary._textures._ui_grey_square, [0, 0], [0.8, 0.1]);
  const fillSprite = createSprite(assetLibrary._textures._ui_red_square, [0, 0], [0.95, 0.7]);
  fillSprite._updater = (sprite, game, delta) => {
    const targetWidth = 0.95 * game._state._levelState!._crazyness;

    sprite._scale[0] = targetWidth;
    sprite._position[0] = -0.158 + (game._state._levelState!._crazyness * 0.158);
  }

  bgSprite._addChild(fillSprite);
  crazyBar._addChild(bgSprite);

  const crazySprite = createSprite(assetLibrary._textures._text_crazy, [-0.09, -0], [0.2, 0.1]);
  crazySprite._updater = (sprite, game, delta) => {
    if (game._state._levelState!._crazyness >= 0.5) {
      crazySprite._position[1] = (utils._sin(game._worker._ticks * 10) * 0.01);
      crazySprite._angle = utils._sin(game._worker._ticks * 10) * 0.1;
    } else {
      crazySprite._position[1] = 0;
      crazySprite._angle = 0;
    }
  };

  crazyBar._addChild(crazySprite);

  return crazyBar;
}