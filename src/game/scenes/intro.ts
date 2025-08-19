import createScene, { Scene } from "../../core/scene";
import createSprite from "../../core/sprite";

export default () => {
  var _ticks = 0;

  const introScene = createScene((_, __, delta) => {
    _ticks += delta;
  });

  introScene._rootSprite._texture = null;

  const anchorSprite = createSprite(null, [300, 200]);

  for (let i = 0; i < 1000; i++) {
    const childSprite = createSprite(0, [100, 0]);
    childSprite._setUpdater((sprite, gameState, delta) => {
      sprite._position[0] = Math.sin((_ticks / 2) + i + 12) * (i * 0.3);
      sprite._position[1] = Math.cos((_ticks / 2) + i + 12) * (i * 0.3);
      sprite._angle = (_ticks + i) * 0.1;
    });
    anchorSprite._addChild(childSprite);
  }

  introScene._rootSprite._addChild(anchorSprite);
  return introScene;
}