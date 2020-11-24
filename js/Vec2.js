class Vec2 {

	x;
	y;

	constructor(x, y) {
		this.x = x;
		this.y = y;
	}


	/**
	 * Gets x over 2, or it's center
	 * @return {number}
	 */
	get centerX() {
		return this.x / 2;
	}

	/**
	 * Gets y over 2, or it's center
	 * @return {number}
	 */
	get centerY() {
		return this.y / 2;
	}


}
