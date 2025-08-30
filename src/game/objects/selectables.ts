import assetLibrary from "../../core/asset_library";
import createSprite, { Sprite } from "../../core/sprite";
import { utils, Vec } from "../../core/utils";

export const createSelectables = (): Sprite => {
  const selectables = createSprite(null, [0, 0]);

  for (let i = 0; i < 5; i++) {
    const base = createSprite(assetLibrary._textures._ui_square_bg, [0, 0 + i * 0.16], [0.26, 0.26]);
    const content = createSprite(assetLibrary._textures._ui_square, [0, 0]);
    content._updater = (sprite, state) => {
      const position = utils._resolvePosition(selectables, base, sprite);
      const distance = utils._vectorDistance(state.input._pointer._coord, position);

      if (distance < 0.06) {
        sprite._texture = assetLibrary._textures._ui_square_light;
      } else {
        sprite._texture = assetLibrary._textures._ui_square;
      }
    }

    base._addChild(content);

    selectables._addChild(base);
  }

  return selectables;
}