import assetLibrary from "../../core/asset_library";
import createScene from "../../core/scene";
import createSprite from "../../core/sprite";
import { utils, Vec } from "../../core/utils";
import { LevelData } from "../state";
import { level1, level2, level3, level4, level5, level6 } from "./gameplay";

const levelIn: Vec = [0.42, 2.4];
const levelTarget: Vec = [0.42, 0.5];

const numberIn: Vec = [0.56, -0.6];
const numberTarget: Vec = [0.56, 0.5];

export const createInterstitial = (level: LevelData, onCompleted: VoidFunction) => {
  const levelMap = new Map<LevelData, number[][]>();
  levelMap.set(level1, assetLibrary._textures._text_one);
  levelMap.set(level2, assetLibrary._textures._text_two);
  levelMap.set(level3, assetLibrary._textures._level_three);
  levelMap.set(level4, assetLibrary._textures._text_four);
  levelMap.set(level5, assetLibrary._textures._text_five);
  levelMap.set(level6, assetLibrary._textures._text_six);

  let ticks = 0;
  const scene = createScene();
  scene._updater = (scene, game, delta) => {
    ticks += delta;
    if (ticks > 4) {
      onCompleted();
    }
  };

  const levelSprite = createSprite(assetLibrary._textures._text_level, levelIn, [0.5, 0.5]);
  levelSprite._updater = (sprite, game, delta) => {
    if (ticks < 2) {
      sprite._position = utils._vectorLerp(levelIn, levelTarget, ticks / 2);
    } else if (ticks > 3) {
      sprite._opacity = utils._max(0, 1 - (ticks - 3));
    }
  };

  const numberSprite = createSprite(levelMap.get(level)!, numberIn, [0.5, 0.5]);
  numberSprite._updater = (sprite, game, delta) => {
    if (ticks < 2) {
      sprite._position = utils._vectorLerp(numberIn, numberTarget, ticks / 2);
    } else if (ticks > 3) {
      sprite._opacity = utils._max(0, 1 - (ticks - 3));
    }
  }

  scene._rootSprite._addChild(levelSprite);
  scene._rootSprite._addChild(numberSprite);

  return scene;
};