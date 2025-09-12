import { Game } from "../core/game";
import { createGameplayScene } from "./scenes/gameplay";
import { createState } from "./state";

new Game(
  createGameplayScene(),
  createState({
    _wandAvailable: true,
    _swatterAvailable: true,
    _flySpawnRate: 0.5,
    _baseCrazyMod: 0.05
  }),
);