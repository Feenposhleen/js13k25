import assetLibrary from "../../core/asset_library";
import createSprite, { Sprite } from "../../core/sprite";
import { utils, Vec } from "../../core/utils";
import { pickupables } from "../state";

export const flySpawner = (): Sprite => {
  let ticks = 0;
  let flySpawned = false;

  const spawner = createSprite(null, [0, 0]);
  spawner._updater = (sprite, game, delta) => {
    if (flySpawned) return;

    ticks += delta;
    if (ticks > game._state._levelState!._levelData._flySpawnInterval) {
      ticks = 0;
      flySpawned = true;
      const fly = createFly(() => {
        flySpawned = false;
        spawner._removeChild(fly);
        game._state._levelState!._flyPosition = null;
      });
      spawner._addChild(fly);
    }
  };

  return spawner;
}

export const createFly = (onSmashed: VoidFunction): Sprite => {
  var ticks = 0;
  var destination: Vec = [utils._rndFloat(), utils._rndFloat()];

  const fly = createSprite(assetLibrary._textures._fly, [utils._rndBool() ? 1 : 0, utils._rndBool() ? 1 : 0], [0.2, 0.2]);
  fly._updater = (sprite, game, delta) => {
    ticks += delta;
    if (ticks > 1) {
      destination = [utils._rndFloat(), utils._rndFloat()];
    }

    const pos = sprite._position;
    const angle = utils._vectorAngle(pos, destination);
    const newPos: Vec = [
      pos[0] + (utils._cos(angle) * 0.2 * delta),
      pos[1] + (utils._sin(angle) * 0.2 * delta),
    ];

    // Add jitter
    const jittered = utils._vectorAdd(newPos, [(utils._rndFloat() - 0.5) * 0.01, (utils._rndFloat() - 0.5) * 0.01]);

    fly._position = jittered;
    game._state._levelState!._flyPosition = jittered;

    const centerCloseness = (2 - utils._simpleDistance(sprite._position, [0.5, 0.5]));
    game._state._levelState!._crazyness += delta * centerCloseness * game._state._levelState!._levelData._baseCrazyMod * 0.3;

    if (game._state._levelState?._selectedItem === utils._keyOf(pickupables, pickupables._swatter)) {
      if (utils._simpleDistance(game._input._pointer._coord, fly._position) < 0.1) {
        onSmashed();
      }
    }
  }

  return fly;
}