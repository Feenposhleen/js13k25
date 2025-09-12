import createScene, { Scene } from "../../core/scene";
import { utils } from "../../core/utils";
import { createCat } from "../objects/cat";
import { createCrazyBar } from "../objects/crazy_bar";
import { createRoom } from "../objects/room";
import { createSelectables } from "../objects/selectables";
import { createSelected } from "../objects/selected";
import { createTableSlots, Slot, slots } from "../objects/table_slots";
import { LevelData, placeables } from "../state";

export const createGameplayLevel = (levelData: LevelData, onCompleted: VoidFunction) => {
  const scene = createScene((scene, game) => {
    game._state._levelState = {
      _levelData: levelData,
      _selectedItem: null,
      _dizzyness: 0.002,
      _crazyness: 0,
      _placedItems: new Map(),
    };

    const room = createRoom();
    room._position = [0.5, 0.5];

    const selectables = createSelectables(levelData);

    const cat = createCat(levelData);
    cat._position = [0.5, 0.4];
    cat._scale = [0.5, 0.5];

    const tableSlots = createTableSlots();


    const selected = createSelected(game._state._pickupables, game._state._placeables);

    scene._rootSprite._addChild(room);
    scene._rootSprite._addChild(tableSlots);
    scene._rootSprite._addChild(cat);
    scene._rootSprite._addChild(selectables);
    scene._rootSprite._addChild(selected);

    if (levelData._baseCrazyMod > 0) {
      const crazyBar = createCrazyBar();
      crazyBar._position = [0.5, 0.1];
      scene._rootSprite._addChild(crazyBar);
    }
  });

  scene._updater = (scene, game, delta) => {
    const allPlaced = slots.every(s => game._state._levelState!._placedItems.get(s));

    if (allPlaced) {
      onCompleted();
    }
  };

  return scene;
};