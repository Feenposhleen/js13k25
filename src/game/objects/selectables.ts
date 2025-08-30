import assetLibrary from "../../core/asset_library";
import createSprite, { Sprite } from "../../core/sprite";
import { utils } from "../../core/utils";

export const placeables: Record<string, number[][]> = {
  _fork: assetLibrary._textures._utensil_fork,
  _knife: assetLibrary._textures._utensil_knife,
  _glass: assetLibrary._textures._utensil_glass,
  _plate: assetLibrary._textures._utensil_plate,
};

export const pickupables: Record<string, number[][]> = {
};

export const createSelectables = (): Sprite => {
  const selectables = createSprite(null, [0, 0]);
  const selectableKeys = Object.keys(placeables);

  for (const key of selectableKeys) {
    const i = selectableKeys.indexOf(key);

    const base = createSprite(assetLibrary._textures._ui_square_bg, [0, 0 + i * 0.16], [0.26, 0.26]);

    const content = createSprite(assetLibrary._textures._ui_square, [0, 0]);
    base._addChild(content);

    const obj = createSprite(placeables[key], [0, 0], [0.8, 0.8]);
    obj._angle = Math.PI / 6;
    content._addChild(obj);

    content._updater = (sprite, state) => {
      if (state._state._selectedItem === key) {
        sprite._children[0]._opacity = 0;
        base._scale[0] = 0.26;
        sprite._texture = assetLibrary._textures._ui_square;
      } else {
        sprite._children[0]._opacity = 0.8;
        const position = utils._resolvePosition(selectables, base, sprite);
        const distance = utils._vectorDistance(state._input._pointer._coord, position);

        if (distance < 0.06) {
          if (state._input._pointer._down && !state._input._pointer._buttonIndex) {
            state._state._selectedItem = key;
          }
          sprite._opacity = 1;
          base._scale[0] = 0.3;
          sprite._texture = assetLibrary._textures._ui_square_light;
        } else {
          base._scale[0] = 0.26;
          sprite._texture = assetLibrary._textures._ui_square;
        }
      }
    }

    selectables._addChild(base);
  }

  return selectables;
}