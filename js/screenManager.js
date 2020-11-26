class ScreenManager {

	#config = Config.getInstance();
	#snowflakes = [];
	#visualiserBars = [];

	#maxSnowflakeCount;
	#context;
	#lastFrameDateTime;
	#dimensions;
	#spotify;

	set audio(values) {
		// values = ;

		//only loop over left ear channel
		values.splice(0, values.length / 2).forEach((value, index) => {
			if(!this.#visualiserBars[index]) {
				this.#visualiserBars.push(new Bar(this.config.getConfigOption('slider_bar_width', 15), value));
			}

			/*  okay so this looks hacky, however it's not
				@line 16 we splice the values, which returns the first half off the array AKA the left channel
			    That also changes the reference of values to only contain whatever is left after splicing AKA the right ear
			 	So now we are looping over all the left ear frequencies, and we can get the right ear frequency with values[index] */
			this.#visualiserBars[index].height = (value + values[index]) / 2 * 2000;
		});
	}

	get config() {
		return this.#config;
	}

	set config(config) {
		this.#config.config = config;
		this.#visualiserBars.forEach(x => x.width = this.config.getConfigOption('slider_bar_width'));
	}

	constructor(maxSnowflakeCount = 200) {
		this.#maxSnowflakeCount = maxSnowflakeCount;
		this.#spotify = new SpotifyConnectorService();

		this.reset();
		this.createCanvas();
		this.draw();
		this.drawSpotify();

		//generate between 75 and maxSnowFlakeCount / 2 (e.g. 100) random snowflakes to start us off
		for(let i = 0, limit = randomNumber(75, maxSnowflakeCount / 2); i < limit; i++) {
			const x = randomNumber(0, this.#dimensions.x), y =  randomNumber(0, this.#dimensions.y);

			this.#snowflakes.push(new Snowflake(x, y));
		}

	}


	draw = () => {
		requestAnimationFrame(this.draw);

		const now = DateService.getNowTimestamp();
		const dt = (now - this.#lastFrameDateTime) / 1000;
		this.#lastFrameDateTime = now;

		//TODO on click
		// this.#snowflakes.push(new Snowflake(200, 100));

		//generate extra snowflakes if necessary
		this.generateSnowflakes(dt);
		this.render(dt);
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

	render = (dt) => {
		//clear the screen entirely
		this.clearScreen();

		//update and draw snowflakes
		this.drawSnowflakes(dt);

		//update and draw synthesizer after snow
		this.drawSynthesizer();
	}

	clearScreen = () => {
		this.#context.clearRect(0, 0, this.#dimensions.x, this.#dimensions.y);
	}

	/**
	 * @param dt float The delta time
 	 */
	drawSnowflakes(dt) {
		//draw snow
		this.#snowflakes.forEach((s, index) => {
			if(s.isSafeToDestroy()) {
				this.#snowflakes.splice(index, 1); //remove the snowflake if out of bounds
				return;
			}

			s.update(dt);
			s.draw(this.#context);
		});
	}

	drawSpotify() {

		// if(!this.#spotify.isReady) {
		//
		// 	setTimeout(() => _this.drawSpotify, 1000);
			//
			// this.drawSpotify();
			// return;
		// }

		// document.getElementById('test').innerText = (new Date()).getTime();

		this.#spotify.getCurrentlyPlaying().then(result => {
			// this.#accessToken = result.access_token;
			// setTimeout(this.authorise, result.expires_in);

			//This is working, however draw will clear the screen every frame
			//TODO sync spotify asynchronously once per second, should be fine according to my quick goooglinh
			//TODO assume the progression of the song
			//TODO render useful data

			document.getElementById('test').innerText += JSON.stringify(result);

			this.#context.font = '50px Arial Black';
			this.#context.fillStyle = 'rgb(255, 255, 255)';

			// this.#context.fontSize = '50px';
			this.#context.fillText("test", this.#dimensions.centerX, this.#dimensions.centerY + 50);

			this.#context.font = '30px Arial Black';
			this.#context.fillText(JSON.stringify(result), this.#dimensions.centerX, this.#dimensions.centerY + 90);

		})
			.catch(_ => {
				//will also end up in here on json decode errors => if nothing is playing, ty spotify

				// document.getElementById('test').innerText += 'error: ' + JSON.stringify(error);
				this.#context.font = '50px Arial Black';
				// this.#context.fontSize = '50px';
				this.#context.fillText('Nothing is playing', this.#dimensions.centerX, this.#dimensions.centerY + 50);
			})
			// .finally(() => {
			// 	setTimeout(() => this.drawSpotify, 1000);
			// });


	}

	drawSynthesizer() {
		const barWidth = this.config.getConfigOption('slider_bar_width', 15);
		const marginBetweenBars = this.config.getConfigOption('slider_bar_margin', 3);

		//gets the startingX, where the first bar should be drawn so the visualiser is exactly centered
		const startX = this.#dimensions.centerX - ((barWidth * this.#visualiserBars.length) / 2) - (marginBetweenBars * (this.#visualiserBars.length / 2));

		// if(!this.#visualiserBarsGradient)
		// 	this.recalculateVisualiserBarsGradient();

		this.#context.fillStyle = this.calculateVisualiserGradient(startX);

		this.#visualiserBars.forEach((bar, i) => {
			bar.update();

			const height = bar.height * this.config.getConfigOption('slider_height_amplifier', 1.5);
			this.#context.fillRect(startX + (bar.width * i) + (marginBetweenBars * i), this.#dimensions.centerY - height, bar.width, height)
		});
	}

	reset = () => {
		this.#dimensions = new Vec2(window.innerWidth, window.innerHeight);
	}

	calculateVisualiserGradient = (x) => {
		const gradient = this.#context.createLinearGradient(x, this.#dimensions.centerY, this.#dimensions.x - x, this.#dimensions.centerY);
		gradient.addColorStop(0, this.config.getColorOption('cp_gradient_bar_0'));
		gradient.addColorStop(0.25, this.config.getColorOption('cp_gradient_bar_1'));
		gradient.addColorStop(0.5,  this.config.getColorOption('cp_gradient_bar_2'));
		gradient.addColorStop(0.75,  this.config.getColorOption('cp_gradient_bar_3'));

		return gradient;
	}
}
