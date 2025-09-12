import assetLibrary from "../../core/asset_library";
import createSprite, { Sprite } from "../../core/sprite";
import { utils } from "../../core/utils";
import { GameState, LevelData, pickupables, placeables } from "../state";

export const createSelectables = (levelData: LevelData): Sprite => {
  const selectables = createSprite(null, [0, 0]);
  const placeablesRoot = createSprite(null, [0.9, 0.1]);
  const pickupablesRoot = createSprite(null, [0.1, 0.1]);

  const placeableKeys = Object.keys(placeables);

  const pickupableKeys = Object.keys(pickupables).filter(key =>
    (key !== utils._keyOf(pickupables, pickupables._wand) || levelData._wandAvailable)
    && (key !== utils._keyOf(pickupables, pickupables._swatter) || levelData._swatterAvailable)
  );

  for (const key of [...placeableKeys, ...pickupableKeys]) {
    const placeable = !!(placeables as Record<string, number[][]>)[key];
    const i = placeable ? placeableKeys.indexOf(key) : pickupableKeys.indexOf(key);

    const base = createSprite(assetLibrary._textures._ui_square_bg, [0, 0 + i * 0.16], [0.26, 0.26]);

    const content = createSprite(assetLibrary._textures._ui_square, [0, 0]);
    base._addChild(content);

    const obj = createSprite(
      placeable
        ? (placeables as Record<string, number[][]>)[key]
        : (pickupables as Record<string, number[][]>)[key],
      [0, 0],
      [0.8, 0.8],
    );

    obj._angle = Math.PI / 6;
    content._addChild(obj);

    content._updater = (sprite, state) => {
      if (state._state._levelState!._selectedItem === key) {
        sprite._children[0]._opacity = 0;
        base._scale[0] = 0.26;
        sprite._texture = assetLibrary._textures._ui_square;
      } else {
        sprite._children[0]._opacity = 0.8;
        const position = utils._resolvePosition(selectables, placeable ? placeablesRoot : pickupablesRoot, base, sprite);
        const distance = utils._simpleDistance(state._input._pointer._coord, position);

        if (distance < 0.06) {
          if (state._input._pointer._down && !state._input._pointer._buttonIndex) {
            state._state._levelState!._selectedItem = key;
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

    (placeable ? placeablesRoot : pickupablesRoot)._addChild(base);
  }

  selectables._addChild(placeablesRoot);
  selectables._addChild(pickupablesRoot);
  return selectables;
}