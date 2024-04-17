import { defineSystem, query } from '@bitecs/classic';
import { Color, Velocity } from '../components';
import { colorFromSpeed } from '../utils/colorFromSpeed';

export const updateColor = defineSystem((world) => {
	const eids = query(world, [Velocity, Color]);

	for (let i = 0; i < eids.length; i++) {
		const eid = eids[i];
		const speed = Math.sqrt(Velocity.x[eid] ** 2 + Velocity.y[eid] ** 2);
		const { r, g, b, a } = colorFromSpeed(speed);

		Color.r[eid] = r;
		Color.g[eid] = g;
		Color.b[eid] = b;
		Color.a[eid] = a;
	}

	return world;
});
