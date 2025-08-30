import assetLibrary from "../../core/asset_library";
import createSprite, { Sprite } from "../../core/sprite";
import { pickupables, placeables } from "./selectables";

export const createSelected = (): Sprite => {
  var ticks = 0;
  var lastSelected: string | null = null;
  const base = createSprite(null, [0, 0]);

  const selectedItemSprite = createSprite(assetLibrary._textures._painting, [-0.45, -0.33], [0.35, 0.35]);
  selectedItemSprite._updater = (_, game, delta) => {
    if (game._state._selectedItem !== lastSelected) {
      selectedItemSprite._position[0] = game._input._pointer._coord[0];
      selectedItemSprite._position[1] = game._input._pointer._coord[1];

      if (game._state._selectedItem) {
        selectedItemSprite._texture = placeables[game._state._selectedItem] || pickupables[game._state._selectedItem];
        lastSelected = game._state._selectedItem;
      } else {
        selectedItemSprite._texture = null;
      }
    } else {
      if (selectedItemSprite._texture) {
        selectedItemSprite._position[0] += ((game._input._pointer._coord[0] - selectedItemSprite._position[0]) * 0.1);
        selectedItemSprite._position[1] += ((game._input._pointer._coord[1] - selectedItemSprite._position[1]) * 0.1);
        selectedItemSprite._angle = 0.03 * Math.sin(ticks * 3);
      }
    }

    ticks += delta;
  };

  base._addChild(selectedItemSprite);

  return base;
}