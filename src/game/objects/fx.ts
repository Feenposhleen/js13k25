import assetLibrary from "../../core/asset_library";
import createSprite, { Sprite } from "../../core/sprite";
import { utils, Vec } from "../../core/utils";

const burstDuration = 1;
const burstCount = 20;
export const createBurst = (parent: Sprite, position: Vec): Sprite => {
  let elapsed = 0;
  let t = 0;

  const base = createSprite(null, position);
  base._updater = (sprite, _, delta) => {
    elapsed = utils._min(burstDuration, elapsed + delta);
    t = (elapsed / burstDuration);
    if (elapsed >= burstDuration) parent._removeChild(base);
  };

  for (let i = 0; i < burstCount; i++) {
    const randDirection = utils._rndRange(-utils._pi, utils._pi);
    const randSpeed = utils._rndFloat();

    const particleVX = utils._cos(randDirection) * randSpeed;
    const particleVY = utils._sin(randDirection) * randSpeed;

    const obj = createSprite(assetLibrary._textures._particle_diamond, [0, 0]);

    obj._updater = (sprite, _, delta) => {
      sprite._position[0] += (particleVX * 0.6 * delta * (1 - t));
      sprite._position[1] += (particleVY * 0.6 * delta * (1 - t)) + (delta * 0.05 * t); // gravity
      sprite._scale[0] = (1 - randSpeed) * 0.1;
      sprite._scale[1] = (1 - randSpeed) * 0.1;
      sprite._opacity = utils._clamp(((4 - (t * 4)) * (1 - randSpeed)), 0, 1);
      sprite._angle += (particleVX + particleVY) * 4 * delta * (1 - t);
    };

    base._addChild(obj);
  }

  return base;
}
