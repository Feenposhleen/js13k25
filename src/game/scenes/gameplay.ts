import createScene, { Scene } from "../../core/scene";
import { utils } from "../../core/utils";
import { LevelData } from "../state";
import { createGameplayLevel } from "./level";

const level1 = {
  _wandAvailable: false,
  _swatterAvailable: false,
  _flySpawnRate: 0,
  _baseCrazyMod: 0,
} as LevelData;

const level2 = {
  _wandAvailable: false,
  _swatterAvailable: false,
  _flySpawnRate: 0,
  _baseCrazyMod: 0.1
} as LevelData;

const level3 = {
  _wandAvailable: true,
  _swatterAvailable: false,
  _flySpawnRate: 0,
  _baseCrazyMod: 0.2
} as LevelData;

const level4 = {
  _wandAvailable: true,
  _swatterAvailable: true,
  _flySpawnRate: 0.1,
  _baseCrazyMod: 0.2
} as LevelData;

export const createGameplayScene = () => createScene(async (scene, game) => {
  let cancelled = false;

  for (const levelData of [level1, level2, level3, level4]) {
    if (cancelled) break;
    await new Promise(res => {
      const level = createGameplayLevel(levelData, res as VoidFunction);
      game._worker._pushScene(level);
    });

    if (!cancelled) {
      game._worker._popScene();
    }
  }
});