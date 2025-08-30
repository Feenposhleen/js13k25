import createSprite, { Sprite } from "../../core/sprite";

export const createTableSlots = (): Sprite => {
  var initialized = false;
  const base = createSprite(null, [0, 0]);

  base._updater = (_, game, delta) => {
    if (!initialized) {
      initialized = true;
      for (const placement of game._state._placements) {
        const obj = createSprite(placement._texture, placement._position, placement._scale);
        placement._sprite = obj;
        base._addChild(obj);
      }
    }

    for (const placement of game._state._placements) {
      if (placement._placed) {
        placement._sprite!._opacity = 1;
      } else {
        placement._sprite!._opacity = 0;
      }
    }
  };

  return base;
}