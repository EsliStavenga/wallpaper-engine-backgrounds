class Vec2 {

	x;
	y;

	constructor(x, y) {
		this.x = x;
		this.y = y;
	}

	get centerX() {
		return this.x / 2;
	}

	get centerY() {
		return this.y / 2;
	}


}
