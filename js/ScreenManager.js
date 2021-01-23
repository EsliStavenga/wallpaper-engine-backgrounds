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
		//decline the speed nearly instantly
		this.#snowflakeSpeedModifier = clamp(this.#snowflakeSpeedModifier-(this.#snowflakeSpeedModifier * 0.8), 1, 5);
		let speedIncreaseBarCount = 0;
		let maxSpeedModifier = 0;

		//only loop over left ear channel
		values.splice(0, values.length / 2).forEach((value, index) => {
			let existingBar = this.#visualiserBars[index];
			const newHeight = (value ) * 2000;

			if(!existingBar) {
				existingBar = new Bar(this.#config.getConfigOption('slider_bar_width', 15), value);
				this.#visualiserBars.push(existingBar);
			}


			//if the difference between the two heights is, idk some random value, or more, then snowflakes go brrrr
			//bar should be at least 150px tall, don't want this eeffect on quiet songs
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

		//if atleast 5 bars have a sudden increase in volume
		if(speedIncreaseBarCount >= 3) {
			this.#snowflakeSpeedModifier = maxSpeedModifier;
		}

		this.#spotifyDataService.startingX = this.getStartingXOfVisualiser();
		this.#spotifyDataService.visualiserWidth = this.getVisualiserWidth();
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

		this.reset();
	}

	reset = () => {
		this.clearScreenFully();
		this.#snowflakes = [];
		this.generateRandomlyPlacedSnowflakes();
	}

	generateRandomlyPlacedSnowflakes = () => {
		//generate between 75 and maxSnowFlakeCount (e.g. 100) random snowflakes to start us off
		for(let i = 0; i < this.#maxSnowflakeCount; i++) {
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

		const now = DateService.getNowTimestamp();
		const dt = (now - this.#lastFrameDateTime) / 1000;
		this.#lastFrameDateTime = now;
		//TODO on click
		// this.#snowflakes.push(new Snowflake(200, 100));

		//This should be after dt calculation else the dt will be insane
		if(this.#isPaused) {
			return;
		}

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
		this.#context.clearRect(0, 0, this.#dimensions.x, this.#dimensions.y);
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

	handleClick = (e) => {
		if(this.#spotifyDataService.isClickOnImage(e.clientX, e.clientY)) {
			this.#spotifyDataService.togglePlayPause();
		}
	}
}
