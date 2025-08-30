import createScene, { Scene } from "../../core/scene";
import { createCat } from "../objects/cat";
import { createRoom } from "../objects/room";
import { createSelectables } from "../objects/selectables";
import { createSelected } from "../objects/selected";
import { createTableSlots } from "../objects/table_slots";

export default () => {
  var _ticks = 0;

  const introScene = createScene((scene, state, delta) => {
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
  tableSlots._position = [0.5, 0.6];

  const selected = createSelected();

  introScene._rootSprite._addChild(room);
  introScene._rootSprite._addChild(cat);
  introScene._rootSprite._addChild(selectables);
  introScene._rootSprite._addChild(tableSlots);
  introScene._rootSprite._addChild(selected);

  return introScene;
}