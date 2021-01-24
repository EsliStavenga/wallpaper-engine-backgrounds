class Bar {

	#dimensions;
	#targetDimensions;
	#lastDimensionsUpdate;

	set height(value) {
		if(value > this.#targetDimensions.y) {
			this.#lastDimensionsUpdate = DateService.getNowTimestamp();
			this.#targetDimensions.y = value;
		}
	}

	get height() {
		return this.#dimensions.y;
	}

	set width(value) {
		this.#dimensions.x = value;
	}

	get width() {
		return this.#dimensions.x;
	}

	constructor(width, height) {
		this.#dimensions = new Vec2(width, height);
		this.#targetDimensions = Object.assign({}, this.#dimensions);
		this.#lastDimensionsUpdate = DateService.getNowTimestamp();
	}

	update = () => {

		if((DateService.getNowTimestamp() - this.#lastDimensionsUpdate) / 1000 > Config.getInstance().getConfigOption('slider_bar_timeout') / 10) {
			this.#targetDimensions = Object.assign({}, this.#dimensions);

			this.#dimensions.y = clamp(this.#dimensions.y - Math.max(this.height /  (window.innerHeight / 2) * 10, 0.25), 1, this.#dimensions.y);
		} else if(this.#dimensions.y < this.#targetDimensions.y) {
			this.#dimensions.y = clamp(this.#dimensions.y + 15, 0, this.#targetDimensions.y);
		}

	}
}
