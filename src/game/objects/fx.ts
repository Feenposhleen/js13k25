import assetLibrary from "../../core/asset_library";
import createSprite, { Sprite } from "../../core/sprite";
import { utils, Vec } from "../../core/utils";

const burstDuration = 1;
const burstCount = 10;
export const createBurst = (parent: Sprite, position: Vec): Sprite => {
  let elapsed = 0;
  let t = 0;
  const rand = utils._rndRange(-100, 100);

  const base = createSprite(null, position);
  base._updater = (sprite, _, delta) => {
    elapsed = Math.min(burstDuration, elapsed + delta);
    t = (elapsed / burstDuration);
    if (elapsed >= burstDuration) parent._removeChild(base);
  };

  for (let i = 0; i < burstCount; i++) {
    const particleRandX = Math.sin(((i / burstCount) + 1) * (483.18 + rand));
    const particleRandY = Math.sin(((i / burstCount) + 1) * (123.42 + rand));
    const obj = createSprite(assetLibrary._textures._particle_diamond, [0, 0]);

    obj._updater = (sprite, _, delta) => {
      sprite._position[0] += particleRandX * 0.4 * delta * (1 - t);
      sprite._position[1] += particleRandY * 0.4 * delta * (1 - t);
      sprite._scale[0] = particleRandX * 0.2;
      sprite._scale[1] = particleRandX * 0.2;
      sprite._opacity = utils._clamp((2 - (t * 4)) - particleRandX, 0, 1);
      sprite._angle += (particleRandX + particleRandY) * 4 * delta * (1 - t);
    };

    base._addChild(obj);
  }

  return base;
}
