import { defineSystem } from "@bitecs/classic";
import { bodyQuery } from "../queries/queries";
import { Position } from "../components/Position";
import { SPEED } from "../constants";
import { Velocity } from "../components/Velocity";

export const moveBodies = defineSystem((world) => {
  const eids = bodyQuery(world);

  for (let i = 0; i < eids.length; i++) {
    const eid = eids[i];

    // Update position based on velocity and the global SPEED factor
    Position.x[eid] += SPEED * Velocity.x[eid];
    Position.y[eid] += SPEED * Velocity.y[eid];
  }

  return world;
});
