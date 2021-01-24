class ControlButtons extends Renderable {

	#isEnabled = false;

	#spotifyDataService;
	#visualiser;

	#controlButtonsWidth = 43;
	#controlButtonsHeight = 27;

	#previousButton = ImageService.createImageFromSource('img/previous.png', () => {}, { height: this.#controlButtonsHeight, width: this.#controlButtonsWidth});
	#nextButton = ImageService.createImageFromSource('img/next.png', () => {}, { height: this.#controlButtonsHeight, width: this.#controlButtonsWidth});



	constructor() {
		super();

		this.#spotifyDataService = new SpotifyDataService();
		this.#visualiser = Visualiser.getInstance();

		EventService.subscribe(EventService.CONFIG_VALUE_CHANGED, () => {
			this.#isEnabled = this._config.getBooleanOption('cbx_show_controls');
		});
	}

	draw = (context) => {
		return new Promise((resolve) => {
			this._draw(context);

			this.drawControlsButton();
			resolve(true);
		});
	}

	handleClick = (e) => {
		if(!this.#isEnabled) {
			return false;
		}

		let isClick = false;

		if(this.isClickOnNextButton(e.clientX, e.clientY)) {
			isClick = true;
			this.#spotifyDataService.nextSong();
		} else if(this.isClickOnPreviousButton(e.clientX, e.clientY)) {
			isClick = true;
			this.#spotifyDataService.previousSong();
		}

		return isClick;
	}

	drawControlsButton = () => {
		if(!this.#isEnabled) {
			return;
		}

		const [nextTX, nextTY, nextBX, nextBY] = this.getNextButtonPlacement();
		const [prevTX, prevTY, prevBX, prevBY] = this.getPreviousButtonPlacement();

		this._context.drawImage(this.#nextButton, nextTX, nextTY, nextBX, nextBY);
		this._context.drawImage(this.#previousButton, prevTX, prevTY, prevBX, prevBY);

	}

	getPreviousButtonPlacement = (isAbsolute = false) => {
		//-13 is the margin
		return this.getControlButtonPlacement(this.#visualiser.getStartingXOfVisualiser() + this.#visualiser.getVisualiserWidth() - this.#controlButtonsWidth * 2 - 13, isAbsolute);
	}

	getNextButtonPlacement = (isAbsolute = false) => {
		return this.getControlButtonPlacement(this.#visualiser.getStartingXOfVisualiser() + this.#visualiser.getVisualiserWidth() - this.#controlButtonsWidth, isAbsolute);
	}

	isClickOnNextButton = (x, y) => {
		return CalculationService.isWithinBoundingBox(x, y, this.getNextButtonPlacement(true));
	}

	isClickOnPreviousButton = (x, y) => {
		return CalculationService.isWithinBoundingBox(x, y, this.getPreviousButtonPlacement(true));
	}

	/**
	 *
	 * @param {number} lowerX The starting position
	 * @param {boolean} isAbsolute Whether to return absolute or relative values
	 * @return {(*|number)[]}
	 */
	getControlButtonPlacement = (lowerX, isAbsolute = false) => {
		const lowerY = this._screenDimensions.centerY + 98;
		const upperX = (isAbsolute ? lowerX : 0) + this.#controlButtonsWidth;
		const upperY = (isAbsolute ? lowerY : 0) + this.#controlButtonsHeight;

		return [
			lowerX,
			lowerY,
			upperX,
			upperY
		];
	}
}
