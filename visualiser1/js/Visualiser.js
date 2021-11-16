class Visualiser extends Renderable {

	static #instance;

	#visualiserBars = [];
	#maxSpeedModifier = 0;
	#speedIncreaseBarCount = 0;


	constructor() {
		super();

		EventService.subscribe(EventService.CONFIG_VALUE_CHANGED, this.updateBars)
		EventService.subscribe(EventService.AUDIO_VALUE_CHANGED, (audio) => { this.updateAudioLevels(audio); });
	}

	static getInstance = () => {
		if(!this.#instance) {
			this.#instance = new this();
		}

		return this.#instance;
	}


	draw = (context) => {
		return new Promise((resolve) => {
			this._draw(context);

			this.drawVisualiser();
			this.#visualiserBars.forEach(b => b.update());

			resolve(true);
		});
	}

	drawVisualiser = () => {

		const x = this.getStartingXOfVisualiser();
		const m = this._config.getConfigOption('slider_bar_margin');

		// if(!this.#visualiserBarsGradient)
		// 	this.recalculateVisualiserBarsGradient();

		this._context.fillStyle = this._config.createVisualiserGradient(this._context, new Vec2(x, this._screenDimensions.centerY), new Vec2(this._screenDimensions.x, this._screenDimensions.centerY));

		this.#visualiserBars.forEach((bar, i) => {
			const height = bar.height * this._config.getConfigOption('slider_height_amplifier', 10);

			this._context.fillRect(x + (bar.width + m) * i, this._screenDimensions.centerY - height, bar.width, height)
		});

	}

	getVisualiserWidth = () => {
		const barWidth = this._config.getConfigOption('slider_bar_width');
		const marginBetweenBars = this._config.getConfigOption('slider_bar_margin');

		//gets the startingX, where the first bar should be drawn so the visualiser is exactly centered
		return ((barWidth + marginBetweenBars) * this.#visualiserBars.length) - (marginBetweenBars - 1);

	}

	getStartingXOfVisualiser = () => {
		return parseInt(this._config.getConfigOption('slider_bar_offset_horizontal', 0)) + this._screenDimensions.centerX - (this.getVisualiserWidth() / 2);
	}

	updateBars = () => {
		this.#visualiserBars.forEach(x => x.width = this._config.getConfigOption('slider_bar_width'));

		if(this.#visualiserBars.length > 0) {
			EventService.fire(EventService.VISUALISER_DIMENSIONS_CHANGED, {
				startingX: this.getStartingXOfVisualiser(),
				width: this.getVisualiserWidth()
			})
		}
	}

	maxBarChangeWithLatestUpdate = () => {
		return this.#maxSpeedModifier;
	}

	barsChangedWithLatestUpdate = () => {
		return this.#speedIncreaseBarCount;
	}

	updateAudioLevels(audio) {
		let speedIncreaseBarCount = 0;
		let maxSpeedModifier = 0;

		//only loop over left ear channel
		audio.splice(0, audio.length / 2).forEach((value, index) => {
			let existingBar = this.#visualiserBars[index];
			const newHeight = value * 2000;

			if(!existingBar) {
				existingBar = new Bar(this._config.getConfigOption('slider_bar_width', 15), value);
				this.#visualiserBars.push(existingBar);
			}


			//if the difference between the two heights is, idk some random value, or more, then snowflakes go brrrr
			//bar should be at least 150px tall, don't want this effect on quiet songs
			if(newHeight > 100 && existingBar.height - newHeight > 60) {
				speedIncreaseBarCount++;
				maxSpeedModifier = Math.max(clamp((existingBar.height - newHeight) / 40, 1, 5) * 8, maxSpeedModifier);
			}

			/*  okay so this looks hacky, however it's not
				@line 16 we splice the values, which returns the first half off the array AKA the left channel
				That also changes the reference of values to only contain whatever is left after splicing AKA the right ear
				 So now we are looping over all the left ear frequencies, and we can get the right ear frequency with values[index] */
			existingBar.height = newHeight;
		});

		this.#maxSpeedModifier = maxSpeedModifier;
		this.#speedIncreaseBarCount = speedIncreaseBarCount;
	}
}
