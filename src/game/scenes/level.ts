import assetLibrary from "../../core/asset_library";
import createScene, { Scene } from "../../core/scene";
import createSprite from "../../core/sprite";
import { utils } from "../../core/utils";
import { createCat } from "../objects/cat";
import { createCrazyBar } from "../objects/crazy_bar";
import { flySpawner } from "../objects/fly";
import { createRoom } from "../objects/room";
import { createSelectables } from "../objects/selectables";
import { createSelected } from "../objects/selected";
import { createTableSlots, Slot, slots } from "../objects/table_slots";
import { LevelData, placeables } from "../state";

export const createGameplayLevel = (levelData: LevelData, onCompleted: VoidFunction) => {
  const dim = createSprite(assetLibrary._textures._ui_square_bg, [0.5, 0.5], [10, 10]);

  const scene = createScene((scene, game) => {
    game._state._levelState = {
      _levelData: levelData,
      _flyPosition: null,
      _selectedItem: null,
      _dizzyness: 0.002,
      _crazyness: 0,
      _done: false,
      _placedItems: new Map(),
    };

    const room = createRoom();
    room._position = [0.5, 0.5];

    const selectables = createSelectables(levelData);

    const cat = createCat(levelData);
    cat._position = [0.5, 0.4];
    cat._scale = [0.5, 0.5];

    const tableSlots = createTableSlots();
    const selected = createSelected();

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

    if (levelData._flySpawnInterval > 0) {
      const spawner = flySpawner();
      scene._rootSprite._addChild(spawner);
    }

    scene._rootSprite._addChild(dim);
  });

  let completed = false;
  let completedTicks = 0;
  let ticks = 0;
  scene._updater = (scene, game, delta) => {
    ticks += delta;
    if (ticks < 1) {
      dim._opacity = utils._clamp(1 - ticks, 0, 1);
    }

    const allPlaced = slots.every(s => game._state._levelState!._placedItems.get(s));

    if (allPlaced) {
      game._state._levelState!._done = true;
      completed = true;
    }

    if (completed) {
      completedTicks += delta;
      dim._opacity = utils._clamp(completedTicks - 1, 0, 1);
      if (completedTicks > 2) {
        onCompleted();
      }
    }
  };

  return scene;
};