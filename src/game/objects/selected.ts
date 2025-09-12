import assetLibrary from "../../core/asset_library";
import createSprite, { Sprite } from "../../core/sprite";
import { utils, Vec } from "../../core/utils";
import { GameState, pickupables, placeables } from "../state";
import { getClosestFreeSlot } from "./table_slots";

export const createSelected = (): Sprite => {
  var lastSelected: string | null = null;
  const base = createSprite(null, [0, 0]);

  const hintSprite = createSprite(null, [0.45, -0.33], [0.35, 0.35]);
  hintSprite._opacity = 0.2;

  const selectedItemSprite = createSprite(null, [-0.45, -0.33], [0.35, 0.35]);
  selectedItemSprite._updater = (_, game, delta) => {
    if (game._state._levelState!._selectedItem !== lastSelected) {
      selectedItemSprite._position[0] = game._input._pointer._coord[0] + utils._sin(game._worker._ticks * 3) * 0.02;
      selectedItemSprite._position[1] = game._input._pointer._coord[1] + utils._cos(game._worker._ticks * 3) * 0.02;

      if (game._state._levelState!._selectedItem) {
        selectedItemSprite._texture = (placeables as Record<string, number[][]>)[game._state._levelState!._selectedItem] || (pickupables as Record<string, number[][]>)[game._state._levelState!._selectedItem];
        lastSelected = game._state._levelState!._selectedItem;

        if (selectedItemSprite._texture === assetLibrary._textures._pickup_swatter
          || selectedItemSprite._texture === assetLibrary._textures._pickup_wand) {
          selectedItemSprite._scale = [.8, .8];
        } else {
          selectedItemSprite._scale = [.35, .35];
        }
      } else {
        selectedItemSprite._texture = null;
        lastSelected = null;
      }
    } else {
      if (selectedItemSprite._texture) {
        selectedItemSprite._position = utils._dampenedApproach(selectedItemSprite._position, game._input._pointer._coord, 0.01 * delta);

        if (selectedItemSprite._texture === assetLibrary._textures._pickup_swatter
          || selectedItemSprite._texture === assetLibrary._textures._pickup_wand) {
          selectedItemSprite._position = utils._dampenedApproach(selectedItemSprite._position, game._input._pointer._coord, 0.1);
          selectedItemSprite._position = utils._vectorAdd(selectedItemSprite._position, [0.01, 0.03]);
          selectedItemSprite._angle = utils._sin(-3 - selectedItemSprite._position[0]);
        } else {
          selectedItemSprite._position = utils._dampenedApproach(selectedItemSprite._position, game._input._pointer._coord, 0.1);
          selectedItemSprite._position[0] += utils._sin(game._worker._ticks * 3) * game._state._levelState!._dizzyness;
          selectedItemSprite._position[1] += utils._cos(game._worker._ticks * 3) * game._state._levelState!._dizzyness;
          selectedItemSprite._angle = 0.03 * utils._sin(game._worker._ticks * 3);
        }

        const slot = getClosestFreeSlot(
          game._state,
          selectedItemSprite._texture!,
          game._input._pointer._coord
        );

        if (slot) {
          hintSprite._texture = selectedItemSprite._texture;

          hintSprite._position = [...slot._position] as Vec;
          hintSprite._scale = slot._scale;

          if (utils._simpleDistance(selectedItemSprite._position, slot._position) < 0.01) {
            game._state._levelState?._placedItems.set(slot, true);
            game._state._levelState!._selectedItem = null;
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