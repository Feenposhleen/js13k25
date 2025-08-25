import { Game } from "../core/game";
import createIntroScene from "./scenes/intro";
import { createStressScene } from "./scenes/stress";

new Game(
  createStressScene(),
  {
    _done: false,
    _paused: false,
  },
);