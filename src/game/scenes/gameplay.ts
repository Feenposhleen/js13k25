import createScene, { Scene } from "../../core/scene";
import { createCat } from "../objects/cat";
import { createCrazyBar } from "../objects/crazy_bar";
import { createRoom } from "../objects/room";
import { createSelectables } from "../objects/selectables";
import { createSelected } from "../objects/selected";
import { createTableSlots } from "../objects/table_slots";

export const createGameplayScene = () => {
  var _ticks = 0;

  const gameplayScene = createScene((scene, state, delta) => {
    _ticks += delta;
  });

  const room = createRoom();
  room._position = [0.5, 0.5];

  const selectables = createSelectables();
  selectables._position = [0.9, 0.1];

  const cat = createCat();
  cat._position = [0.5, 0.4];
  cat._scale = [0.5, 0.5];

  const tableSlots = createTableSlots();
  const crazyBar = createCrazyBar();
  crazyBar._position = [0.5, 0.1];

  const selected = createSelected();

  gameplayScene._rootSprite._addChild(room);
  gameplayScene._rootSprite._addChild(tableSlots);
  gameplayScene._rootSprite._addChild(cat);
  gameplayScene._rootSprite._addChild(selectables);
  gameplayScene._rootSprite._addChild(selected);
  gameplayScene._rootSprite._addChild(crazyBar);

  return gameplayScene;
};