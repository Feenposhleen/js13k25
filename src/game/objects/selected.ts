import assetLibrary from "../../core/asset_library";
import createSprite, { Sprite } from "../../core/sprite";
import { utils, Vec } from "../../core/utils";
import { getClosestFreePlacement } from "../state";
import { pickupables, placeables } from "./selectables";

export const createSelected = (): Sprite => {
  var lastSelected: string | null = null;
  const base = createSprite(null, [0, 0]);

  const hintSprite = createSprite(null, [0.45, -0.33], [0.35, 0.35]);
  hintSprite._opacity = 0.2;

  const selectedItemSprite = createSprite(null, [-0.45, -0.33], [0.35, 0.35]);
  selectedItemSprite._updater = (_, game, delta) => {
    if (game._state._selectedItem !== lastSelected) {
      selectedItemSprite._position[0] = game._input._pointer._coord[0] + utils._sin(game._worker._ticks * 3) * 0.02;
      selectedItemSprite._position[1] = game._input._pointer._coord[1] + utils._cos(game._worker._ticks * 3) * 0.02;

      if (game._state._selectedItem) {
        selectedItemSprite._texture = placeables[game._state._selectedItem] || pickupables[game._state._selectedItem];
        lastSelected = game._state._selectedItem;
      } else {
        selectedItemSprite._texture = null;
        lastSelected = null;
      }
    } else {
      if (selectedItemSprite._texture) {
        selectedItemSprite._position = utils._dampenedApproach(selectedItemSprite._position, game._input._pointer._coord, 0.1);
        selectedItemSprite._position[0] += utils._sin(game._worker._ticks * 3) * game._state._dizzyness;
        selectedItemSprite._position[1] += utils._cos(game._worker._ticks * 3) * game._state._dizzyness;
        selectedItemSprite._angle = 0.03 * utils._sin(game._worker._ticks * 3);

        const placement = getClosestFreePlacement(
          game._state,
          selectedItemSprite._texture!,
          game._input._pointer._coord
        );

        if (placement) {
          hintSprite._texture = selectedItemSprite._texture;

          hintSprite._position = [...placement._position];
          hintSprite._scale = placement._scale;

          if (utils._simpleDistance(selectedItemSprite._position, placement._position) < 0.02) {
            placement._placed = true;
            game._state._selectedItem = null;
          }
        }
      } else {
        selectedItemSprite._position[0] = game._input._pointer._coord[0];
        hintSprite._texture = null;
      }
    }
  };

  base._addChild(hintSprite);
  base._addChild(selectedItemSprite);

  return base;
}