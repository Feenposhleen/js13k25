import assetLibrary from "../../core/asset_library";
import createScene, { Scene } from "../../core/scene";
import { createCat } from "../objects/cat";
import { createCrazyBar } from "../objects/crazy_bar";
import { createRoom } from "../objects/room";
import { createSelectables } from "../objects/selectables";
import { createSelected } from "../objects/selected";
import { createTableSlots } from "../objects/table_slots";
import { LevelData } from "../state";

export const createGameplayLevel = (levelData: LevelData) => createScene((scene, game) => {
  const room = createRoom();
  room._position = [0.5, 0.5];

  const selectables = createSelectables(levelData);

  const cat = createCat();
  cat._position = [0.5, 0.4];
  cat._scale = [0.5, 0.5];

  const tableSlots = createTableSlots();
  const crazyBar = createCrazyBar();
  crazyBar._position = [0.5, 0.1];

  const selected = createSelected(game._state._pickupables, game._state._placeables);

  scene._rootSprite._addChild(room);
  scene._rootSprite._addChild(tableSlots);
  scene._rootSprite._addChild(cat);
  scene._rootSprite._addChild(selectables);
  scene._rootSprite._addChild(selected);
  scene._rootSprite._addChild(crazyBar);
});