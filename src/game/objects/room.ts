import assetLibrary from "../../core/asset_library";
import createSprite, { Sprite } from "../../core/sprite";
import { utils } from "../../core/utils";


export const createRoom = (): Sprite => {
  const room = createSprite(null, [0, 0]);

  const paintingSprite = createSprite(assetLibrary._textures._painting, [-0.45, -0.33], [0.8, 0.8]);
  paintingSprite._updater = (_, game, delta) => {
    paintingSprite._angle = 0.03 * utils._sin(game._worker._ticks * .5);
  };

  const tableSprite = createSprite(assetLibrary._textures._table, [0, 0.28], [2, 2]);
  const roomSprite = createSprite(assetLibrary._textures._room, [0.02, -0.1], [3.2, 3.2]);

  room._addChild(roomSprite);
  room._addChild(paintingSprite);
  room._addChild(tableSprite);

  return room;
}