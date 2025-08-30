import assetLibrary from "../../core/asset_library";
import createSprite, { Sprite } from "../../core/sprite";
import { utils, Vec } from "../../core/utils";
import { GameState, Placement } from "../state";
import { pickupables, placeables } from "./selectables";


export const createTableSlots = (): Sprite => {
  var initialized = false;
  var lastSelected: string | null = null;
  const base = createSprite(null, [0, 0]);


  base._updater = (_, game, delta) => {
    if (!initialized) {
      for (const placement of game._state._placements) {
        const obj = createSprite(placement._texture, placement._position, placement._scale);
        placement._sprite = obj;
        base._addChild(obj);
      }
    }
  }

  return base;
}