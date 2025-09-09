import { Game } from "../core/game";
import { createGameplayScene } from "./scenes/gameplay";
import { createInitialState } from "./state";

new Game(
  createGameplayScene(),
  createInitialState(),
);