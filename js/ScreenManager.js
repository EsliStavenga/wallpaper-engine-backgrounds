class ScreenManager {

	#config = Config.getInstance();
	#snowflakes = [];
	#visualiserBars = [];

	#maxSnowflakeCount;
	#context;
	#lastFrameDateTime;
	#dimensions;
	#spotifyDataService;

	set audio(values) {
		// values = ;

		//only loop over left ear channel
		values.splice(0, values.length / 2).forEach((value, index) => {
			if(!this.#visualiserBars[index]) {
				this.#visualiserBars.push(new Bar(this.#config.getConfigOption('slider_bar_width', 15), value));

				this.#spotifyDataService.startingX = this.getStartingXOfVisualiser();
				this.#spotifyDataService.visualiserWidth = this.getVisualiserWidth();
			}

			/*  okay so this looks hacky, however it's not
				@line 16 we splice the values, which returns the first half off the array AKA the left channel
			    That also changes the reference of values to only contain whatever is left after splicing AKA the right ear
			 	So now we are looping over all the left ear frequencies, and we can get the right ear frequency with values[index] */
			this.#visualiserBars[index].height = (value + values[index]) / 2 * 2000;
		});
	}

	constructor(maxSnowflakeCount = 200) {
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
		for(let i = 0, limit = randomNumber(75, maxSnowflakeCount / 2); i < limit; i++) {
			const x = randomNumber(0, this.#dimensions.x), y =  randomNumber(0, this.#dimensions.y);

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

		//generate extra snowflakes if necessary
		this.generateSnowflakes(dt);
		this.update(dt);
		this.render();
	}

	generateSnowflakes = () => {
		//if already max amount of snowflakes, return
		if(this.#snowflakes.length === this.#maxSnowflakeCount) {
			return;
		}

		for(let i = this.#snowflakes.length; i < this.#maxSnowflakeCount; i++) {
			if(randomNumber(0, 1) > 0.9999) { //very low probability to generate a snowflake
				this.#snowflakes.push(new Snowflake());

				//generate a max of 1 snowflake per update cycle
				return;
			}
		}
	}

	createCanvas = () => {
		const canvas = document.createElement('canvas');
		canvas.width = this.#dimensions.x;
		canvas.height = this.#dimensions.y;

		document.body.append(canvas);
		this.#context = canvas.getContext('2d');
	}

	update = (dt) => {
		this.#snowflakes.forEach((s, index) => {
			if(s.isSafeToDestroy()) {
				this.#snowflakes.splice(index, 1); //remove the snowflake if out of bounds
				return;
			}

			s.update(dt);
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

	clearScreen = () => {
		//only clear everything near snowflake
		this.#snowflakes.forEach(s => {
			//clear a slightly bigger radius than the actual snowflake
			//because of its angle otherwise it will sometimes leave a trail
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

		this.#context.fillStyle = this.calculateVisualiserGradient(x);

		this.#visualiserBars.forEach((bar, i) => {
			const height = bar.height * this.#config.getConfigOption('slider_height_amplifier');

			this.#context.fillRect(x + (bar.width + m) * i, this.#dimensions.centerY - height, bar.width, height)
		});

	}

	calculateVisualiserGradient = (x) => {
		const gradient = this.#context.createLinearGradient(x, this.#dimensions.centerY, this.#dimensions.x - x, this.#dimensions.centerY);
		gradient.addColorStop(0, this.#config.getColorOption('cp_gradient_bar_0'));
		gradient.addColorStop(0.25, this.#config.getColorOption('cp_gradient_bar_1'));
		gradient.addColorStop(0.5,  this.#config.getColorOption('cp_gradient_bar_2'));
		gradient.addColorStop(0.75,  this.#config.getColorOption('cp_gradient_bar_3'));

		return gradient;
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
