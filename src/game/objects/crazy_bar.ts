import assetLibrary from "../../core/asset_library";
import createSprite, { Sprite } from "../../core/sprite";
import { utils } from "../../core/utils";

export const createCrazyBar = (): Sprite => {
  const crazyBar = createSprite(null, [0, 0]);
  crazyBar._updater = (sprite, game, delta) => {
    let crazyMod = 0.05;
    if (game._state._levelState!._selectedItem == '_wand') {
      crazyMod = -0.1;
    }

    game._state._levelState!._crazyness = utils._clamp(game._state._levelState!._crazyness + (delta * game._state._levelState!._levelData._baseCrazyMod * 10 * crazyMod), 0, 1);
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
  crazyBar._addChild(crazySprite);

  return crazyBar;
}