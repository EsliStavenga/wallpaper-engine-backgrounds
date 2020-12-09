class ScreenManager {

	#config = Config.getInstance();
	#snowflakes = [];
	#visualiserBars = [];
	#maxSnowflakeCount;
	#snowflakeSpeedModifier = 1;

	#canvas;
	#context;
	#lastFrameDateTime;
	#dimensions;
	#spotifyDataService;

	#isPaused = false;

	set isPaused(val) {
		this.#isPaused = val;
		this.#spotifyDataService.isPaused = this.#isPaused;

		if(!val) {
			this.clearScreenFully();
		}
	}

	set dimensions(val) {
		if(!val instanceof Vec2) {
			return;
		}

		this.#dimensions = val;

		if(this.#canvas) {
			this.#canvas.width = val.x;
			this.#canvas.height = val.y;
		}
	}

	set audio(values) {
		this.#snowflakeSpeedModifier = clamp(this.#snowflakeSpeedModifier-0.2, 1, 5);

		//only loop over left ear channel
		values.splice(0, values.length / 2).forEach((value, index) => {
			let existingBar = this.#visualiserBars[index];
			const newHeight = (value + values[index]) / 2 * 2000;

			if(!existingBar) {

				this.#spotifyDataService.startingX = this.getStartingXOfVisualiser();
				this.#spotifyDataService.visualiserWidth = this.getVisualiserWidth();

				existingBar = new Bar(this.#config.getConfigOption('slider_bar_width', 15), value);
				this.#visualiserBars.push(existingBar);
			}


			//if the difference between the two heights is, idk some random value, or more, then snowflakes go brrrr
			//bar should be at least 150px tall, don't want this eeffect on quiet songs
			if(newHeight > 100 && existingBar.height - newHeight > 100) {
				this.#snowflakeSpeedModifier = clamp((existingBar.height - newHeight) / 40, 1, 5);
			}

			/*  okay so this looks hacky, however it's not
				@line 16 we splice the values, which returns the first half off the array AKA the left channel
			    That also changes the reference of values to only contain whatever is left after splicing AKA the right ear
			 	So now we are looping over all the left ear frequencies, and we can get the right ear frequency with values[index] */
			existingBar.height = newHeight;
		});
	}

	constructor(maxSnowflakeCount = 110) {
		this.#maxSnowflakeCount = maxSnowflakeCount;
		this.#dimensions = new Vec2(window.innerWidth, window.innerHeight);
		this.#spotifyDataService = new SpotifyDataService(this.#dimensions);

		this.createCanvas();
		this.handleNextFrame();

		this.#config.onConfigChanged = (_) => {
			this.#visualiserBars.forEach(x => x.width = this.#config.getConfigOption('slider_bar_width'));

			if(this.#visualiserBars.length > 0) {
				this.#spotifyDataService.startingX = this.getStartingXOfVisualiser();
				this.#spotifyDataService.visualiserWidth = this.getVisualiserWidth();
			}
		}

		//generate between 75 and maxSnowFlakeCount / 2 (e.g. 100) random snowflakes to start us off
		for(let i = 0; i < maxSnowflakeCount; i++) {
			let x = randomNumber(-50, this.#dimensions.x), y =  randomNumber(0, this.#dimensions.y);
			let tries = 0;
			//try to keep every snowflake away from other snowflakes for a maximum of 5 times, after which just accept your fate
			while(tries <= 5 && (this.#snowflakes.filter(s => s.posX - x <= 50 && s.posY - y < 50)).length > 0) {
				x =  randomNumber(-50, this.#dimensions.x);
				y =  randomNumber(0, this.#dimensions.y);
				tries++;
			}

			this.#snowflakes.push(new Snowflake(x, y));
		}

	}


	handleNextFrame = () => {
		requestAnimationFrame(this.handleNextFrame);

		if(this.#isPaused) {
			return;
		}

		const now = DateService.getNowTimestamp();
		const dt = (now - this.#lastFrameDateTime) / 1000;
		this.#lastFrameDateTime = now;
		//TODO on click
		// this.#snowflakes.push(new Snowflake(200, 100));

		//generate extra snowflakes if necessary

		this.update(dt);
		this.render();
	}

	createCanvas = () => {
		const canvas = document.createElement('canvas');
		canvas.width = this.#dimensions.x;
		canvas.height = this.#dimensions.y;

		document.body.append(canvas);
		this.#canvas = canvas;
		this.#context = canvas.getContext('2d');
	}

	update = (dt) => {
		this.#snowflakes.forEach((s, index) => {
			if(s.isSafeToDestroy()) {
				this.#snowflakes.splice(index, 1); //remove the snowflake if out of bounds
				this.#snowflakes.push(new Snowflake()); //add a new one at the start
				return;
			}

			s.update(dt, this.#snowflakeSpeedModifier);
		});

		this.#visualiserBars.forEach(b => b.update());
		this.#spotifyDataService.update(dt);
	}

	render = () => {
		//clear the screen entirely
		this.clearScreen();

		//update and draw snowflakes
		this.drawSnowflakes();

		//update and draw synthesizer after snow
		this.drawSynthesizer();
		this.#spotifyDataService.draw(this.#context);
	}

	/**
	 * Clear the parts of the screen that are likely to be redrawn
	 */
	clearScreen = () => {
		//only clear everything near snowflake
		this.#snowflakes.forEach(s => {
			//clear a slightly bigger radius than the actual snowflake
			//because of its angle otherwise it will sometimes leave a trail
			//and because its position is updated before we draw
			const d= Math.ceil(s.diameter * 6);
			this.#context.clearRect(s.left - s.diameter * 3, s.top - s.diameter * 3, d, d)
		});

		//gets the startingX, where the first bar should be drawn so the visualiser is exactly centered
		const startX = this.getStartingXOfVisualiser();

		//only clear visualiser and progress bar
		this.#context.clearRect(startX, 0, this.getVisualiserWidth(), this.#dimensions.centerY + 30);

		//clear spotify dat
		this.#context.clearRect(startX, this.#dimensions.centerY, this.getVisualiserWidth(), this.#spotifyDataService.songDataTopMargin +this.#spotifyDataService.songSubtitleFontSize + this.#spotifyDataService.songTitleFontSize);
	}

	/**
	 * Clears the entire screen in one go
	 */
	clearScreenFully = () => {
		this.#context.clearRect(0, 0, this.#dimensions.x, this.#dimensions.y);
	}

	drawSnowflakes = () => {
		//draw snow
		this.#snowflakes.forEach((s) => {
			s.draw(this.#context);
		});
	}

	drawSynthesizer = () => {
		const x = this.getStartingXOfVisualiser();
		const m = this.#config.getConfigOption('slider_bar_margin');

		// if(!this.#visualiserBarsGradient)
		// 	this.recalculateVisualiserBarsGradient();

		this.#context.fillStyle = this.#config.createVisualiserGradient(this.#context, new Vec2(x, this.#dimensions.centerY), new Vec2(this.#dimensions.x, this.#dimensions.centerY));

		this.#visualiserBars.forEach((bar, i) => {
			const height = bar.height * this.#config.getConfigOption('slider_height_amplifier');

			this.#context.fillRect(x + (bar.width + m) * i, this.#dimensions.centerY - height, bar.width, height)
		});

	}

	getVisualiserWidth = () => {
		const barWidth = this.#config.getConfigOption('slider_bar_width');
		const marginBetweenBars = this.#config.getConfigOption('slider_bar_margin');

		//gets the startingX, where the first bar should be drawn so the visualiser is exactly centered
		return ((barWidth + marginBetweenBars) * this.#visualiserBars.length) - (marginBetweenBars - 1);

	}

	getStartingXOfVisualiser = () => {
		return this.#dimensions.centerX - (this.getVisualiserWidth() / 2);
	}
}
