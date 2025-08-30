import { Game } from "../core/game";
import createIntroScene from "./scenes/intro";
import { createStressScene } from "./scenes/stress";
import { createInitialState } from "./state";

new Game(
  createIntroScene(),
  createInitialState(),
);