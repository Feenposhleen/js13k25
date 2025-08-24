import assetLibrary from "../../core/asset_library";
import createScene, { Scene } from "../../core/scene";
import createSprite from "../../core/sprite";
import { createCat } from "../objects/cat";

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

    _ticks += delta;
  });

  const anchorSprite = createSprite(null, [300, 200]);


  const tableSprite = createSprite(assetLibrary._textures._table, [0, 135], [2.2, 1.6]);
  const roomSprite = createSprite(assetLibrary._textures._room, [0, 30], [2.5, 2.5]);

  const cat = createCat();

  anchorSprite._addChild(roomSprite);
  anchorSprite._addChild(tableSprite);
  anchorSprite._addChild(cat);

  introScene._rootSprite._addChild(anchorSprite);
  return introScene;
}