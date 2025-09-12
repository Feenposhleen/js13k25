import createScene, { Scene } from "../../core/scene";
import { createGameplayLevel } from "./level";

export const createGameplayScene = () => createScene((scene, game) => {
  const level = createGameplayLevel({
    _wandAvailable: false,
    _swatterAvailable: true,
    _flySpawnRate: 0.5,
    _baseCrazyMod: 0.05
  });

  game._worker._pushScene(level);
});