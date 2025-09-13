import createScene, { Scene } from "../../core/scene";
import { utils } from "../../core/utils";
import { LevelData } from "../state";
import { createInterstitial } from "./interstitial";
import { createGameplayLevel } from "./level";

export const level1 = {
  _wandAvailable: false,
  _swatterAvailable: false,
  _flySpawnInterval: 0,
  _baseCrazyMod: 0,
} as LevelData;

export const level2 = {
  _wandAvailable: false,
  _swatterAvailable: false,
  _flySpawnInterval: 0,
  _baseCrazyMod: 0.1
} as LevelData;

export const level3 = {
  _wandAvailable: true,
  _swatterAvailable: false,
  _flySpawnInterval: 0,
  _baseCrazyMod: 0.2
} as LevelData;

export const level4 = {
  _wandAvailable: false,
  _swatterAvailable: true,
  _flySpawnInterval: 2,
  _baseCrazyMod: 0.05
} as LevelData;

export const level5 = {
  _wandAvailable: true,
  _swatterAvailable: true,
  _flySpawnInterval: 6,
  _baseCrazyMod: 0.2
} as LevelData;

export const level6 = {
  _wandAvailable: true,
  _swatterAvailable: true,
  _flySpawnInterval: 4,
  _baseCrazyMod: 0.3
} as LevelData;

export const createGameplayScene = () => createScene(async (scene, game) => {
  let cancelled = false;

  for (const levelData of [level1, level2, level3, level4, level5, level6]) {

    if (cancelled) break;
    await new Promise(res => {
      const level = createInterstitial(levelData, res as VoidFunction);
      game._worker._pushScene(level);
    });

    if (!cancelled) {
      game._worker._popScene();
    }

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