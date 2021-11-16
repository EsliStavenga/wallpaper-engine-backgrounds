class Vec2 {

	x;
	y;
	_config;

	constructor(x, y) {
		this.x = x;
		this.y = y;
		this._config = Config.getInstance();
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
		const verticalOffset = parseInt(this._config.getConfigOption('slider_bar_offset_vertical', 0));

		return this.y / 2 + verticalOffset;
	}


}
