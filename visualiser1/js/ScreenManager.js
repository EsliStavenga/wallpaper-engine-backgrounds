class ScreenManager {

	#snowflakes = [];
	#maxSnowflakeCount;
	#snowflakeSpeedModifier = 1;

	#canvas;
	#context;
	#lastFrameDateTime;
	#spotifyDataService;
	#controlButtons;
	#dimensions;
	#visualiser;
	#isMouseDown = false;
	mouseDownEvent = false;

	#isPaused = true;
	#temporarySnowflakes = [];

	set isPaused(val) {
		this.#isPaused = val;
		this.#spotifyDataService.isPaused = this.#isPaused;

		if(!val) {
			this.reset();
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

	constructor(maxSnowflakeCount = 110) {
		EventService.subscribe(EventService.SCREEN_RESIZE, (dimensions) => {
			this.dimensions = dimensions;

			this.reset();
			this.recreateCanvas();
		});

		EventService.subscribe(EventService.AUDIO_VALUE_CHANGED, () => { this.parseAudioLevels() });

		this.#maxSnowflakeCount = maxSnowflakeCount;
		this.#spotifyDataService = new SpotifyDataService();
		this.#controlButtons = new ControlButtons();
		this.#visualiser = Visualiser.getInstance();

		this.handleNextFrame();
	}

	reset = () => {
		this.#isPaused = false;
		this.#snowflakes = [];
		//don't reset temporarySnowflakes, helps easy in the wallpaper after being paused

		this.generateRandomlyPlacedSnowflakes();
	}

	generateRandomlyPlacedSnowflakes = () => {
		//generate between 75 and maxSnowFlakeCount (e.g. 100) random snowflakes to start us off
		for(let i = 0; i < this.#maxSnowflakeCount; i++) {
			const snowflake = this.generateRandomlyPlacedSnowflake();

			this.#snowflakes.push(snowflake);
		}
	}

	handleNextFrame = () => {
		requestAnimationFrame(this.handleNextFrame);

		const now = DateService.getNowTimestamp();
		const dt = (now - this.#lastFrameDateTime) / 1000;
		this.#lastFrameDateTime = now;

		//This should be after dt calculation else the dt will be insane
		if(this.#isPaused) {
			return;
		}

		//generate extra snowflakes if necessary

		this.update(dt);
		this.render();
	}

	recreateCanvas = () => {
		this.removeExistingCanvas();

		const canvas = document.createElement('canvas');
		canvas.width = this.#dimensions.x;
		canvas.height = this.#dimensions.y;

		document.body.append(canvas);
		this.#canvas = canvas;
		this.#context = canvas.getContext('2d');
	}

	removeExistingCanvas = () => {
		const canvas = document.querySelector('canvas');
		if(!canvas) {
			return;
		}

		canvas.remove();
	}

	update = (dt) => {
		this.generateTemporarySnow();

		this.updateSnowflakes(this.#snowflakes, dt, true);
		this.updateSnowflakes(this.#temporarySnowflakes, dt);

		//decline the speed nearly instantly
		this.#snowflakeSpeedModifier = clamp(this.#snowflakeSpeedModifier-(this.#snowflakeSpeedModifier * 0.8), 1, 5);

		//RIP
		this.#spotifyDataService.update(dt);
	}

	/**
	 *
	 * @param snowflakes An array of snowflakes
	 * @param dt The deltatime
	 * @param regenerate Whether to replace the snowflake with a fresh new one
	 */
	updateSnowflakes = (snowflakes, dt, regenerate = false) => {
		snowflakes.forEach((s, index) => {

			if(s.isSafeToDestroy()) {
				snowflakes.splice(index, 1); //remove the snowflake if out of bounds

				if(regenerate) {
					snowflakes.push(new Snowflake()); //add a new one at the start
				}
			} else {
				s.update(dt, this.#snowflakeSpeedModifier);
			}

		});
	}

	render = () => {
		//clear the screen entirely
		this.clearScreen();

		//update and draw snowflakes
		this.drawSnowflakes();

		//update and draw synthesizer after snow
		this.#visualiser.draw(this.#context);
		this.#spotifyDataService.draw(this.#context);
		this.#controlButtons.draw(this.#context);
	}

	/**
	 * Clear the parts of the screen that are likely to be redrawn
	 */
	clearScreen = () => {
		this.#context.clearRect(0, 0, this.#dimensions.x, this.#dimensions.y);
	}

	drawSnowflakes = () => {
		//draw snow
		this.#snowflakes.forEach((s) => {
			s.draw(this.#context);
		});

		this.#temporarySnowflakes.forEach((s) => {
			s.draw(this.#context);
		})
	}

	handleClick = (e) => {
		if(this.#spotifyDataService.handleClick(e) || this.#controlButtons.handleClick(e)) {
			return;
		}

		this.#isMouseDown = true;
		this.mouseDownEvent = e;
	}

	handleClickUp = (e) => {
		this.#isMouseDown = false;
	}

	parseAudioLevels = (audio) => {
		//if atleast 5 bars have a sudden increase in volume
		if(this.#visualiser.barsChangedWithLatestUpdate() >= 3) {
			this.#snowflakeSpeedModifier = this.#visualiser.maxBarChangeWithLatestUpdate();
		}

		this.#spotifyDataService.startingX = this.#visualiser.getStartingXOfVisualiser();
		this.#spotifyDataService.visualiserWidth = this.#visualiser.getVisualiserWidth();
	}

	generateTemporarySnow = () => {
		if(!this.#isMouseDown || !this.mouseDownEvent) {
			return;
		}

		this.#temporarySnowflakes.push(new Snowflake(this.mouseDownEvent.clientX, this.mouseDownEvent.clientY));
	}

	generateRandomlyPlacedSnowflake = () => {
		let x = randomNumber(-50, this.#dimensions.x), y =  randomNumber(0, this.#dimensions.y);
		let tries = 0;

		//try to keep every snowflake away from other snowflakes for a maximum of 5 times, after which just accept your fate
		while(tries <= 5 && (this.#snowflakes.filter(s => s.posX - x <= 50 && s.posY - y < 50)).length > 0) {
			x =  randomNumber(-50, this.#dimensions.x);
			y =  randomNumber(0, this.#dimensions.y);
			tries++;
		}

		return new Snowflake(x, y);
	}
}
