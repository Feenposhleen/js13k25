import { Game } from "../core/game";
import createIntroScene from "./scenes/intro";
import { createStressScene } from "./scenes/stress";

new Game(
  createIntroScene(),
  {
    _done: false,
    _paused: false,
  },
);