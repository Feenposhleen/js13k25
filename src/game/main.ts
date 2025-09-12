import { Game } from "../core/game";
import { createGameplayScene } from "./scenes/gameplay";
import { createState } from "./state";

new Game(
  createGameplayScene(),
  createState(),
);