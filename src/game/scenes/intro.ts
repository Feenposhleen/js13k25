import assetLibrary from "../../core/asset_library";
import createScene, { Scene } from "../../core/scene";
import createSprite from "../../core/sprite";

export default () => {
  var _ticks = 0;

  const introScene = createScene((scene, state, delta) => {
    if (state.input._keys["w"]) {
      anchorSprite._position[1] -= 100 * delta;
    } else if (state.input._keys["s"]) {
      anchorSprite._position[1] += 100 * delta;
    }

    if (state.input._keys["a"]) {
      anchorSprite._position[0] -= 100 * delta;
    } else if (state.input._keys["d"]) {
      anchorSprite._position[0] += 100 * delta;
    }

    if (state.input._pointer._down) {
      anchorSprite._position = state.input._pointer._coord;
    }

    _ticks += delta;
  });

  const anchorSprite = createSprite(null, [300, 200]);

  const childSprite = createSprite(
    assetLibrary._textures._table,
    [0, 10],
    [2, 2],
  );

  anchorSprite._addChild(childSprite);

  introScene._rootSprite._addChild(anchorSprite);
  return introScene;
}