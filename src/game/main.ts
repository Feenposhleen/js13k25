import { Game } from "../core/game";
import { createGameplayScene, level2 } from "./scenes/gameplay";
import { createInterstitial } from "./scenes/interstitial";
import { createState } from "./state";

new Game(
  createGameplayScene(),
  createState(),
);