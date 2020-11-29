class ScreenManager {

	#config = Config.getInstance();
	#snowflakes = [];
	#visualiserBars = [];

	#maxSnowflakeCount;
	#context;
	#lastFrameDateTime;
	#dimensions;
	#spotify;

	#currentAlbumCover = undefined;

	set audio(values) {
		// values = ;

		//only loop over left ear channel
		values.splice(0, values.length / 2).forEach((value, index) => {
			if(!this.#visualiserBars[index]) {
				this.#visualiserBars.push(new Bar(this.#config.getConfigOption('slider_bar_width', 15), value));
			}

			/*  okay so this looks hacky, however it's not
				@line 16 we splice the values, which returns the first half off the array AKA the left channel
			    That also changes the reference of values to only contain whatever is left after splicing AKA the right ear
			 	So now we are looping over all the left ear frequencies, and we can get the right ear frequency with values[index] */
			this.#visualiserBars[index].height = (value + values[index]) / 2 * 2000;
		});
	}

	set config(config) {
		this.#config.config = config;
		this.#visualiserBars.forEach(x => x.width = this.#config.getConfigOption('slider_bar_width'));
	}

	constructor(maxSnowflakeCount = 200) {
		this.#maxSnowflakeCount = maxSnowflakeCount;
		this.#spotify = new SpotifyConnectorService();
		this.#dimensions = new Vec2(window.innerWidth, window.innerHeight);

		this.createCanvas();
		this.handleNextFrame();

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
	}

	render = () => {
		//clear the screen entirely
		this.clearScreen();

		//update and draw snowflakes
		this.drawSnowflakes();

		//update and draw synthesizer after snow
		this.drawSynthesizer();
		this.drawSpotify();
	}

	clearScreen = () => {
		//only clear everything near snowflake
		this.#snowflakes.forEach(s => {
			//clear a slightly bigger radius than the actual snowflake
			//because of its angle otherwise it will sometimes leave a trail
			const d= Math.ceil(s.diameter * 4);
			this.#context.clearRect(s.left - s.diameter * 2, s.top - s.diameter * 2, d, d)
		});

		//gets the startingX, where the first bar should be drawn so the visualiser is exactly centered
		const startX = this.getStartingXOfVisualiser();

		//only clear visualiser
		this.#context.clearRect(startX, 0, this.getVisualiserWidth(), this.#dimensions.centerY);

		//clear spotify dat
		this.#context.clearRect(startX, this.#dimensions.centerY + 10, this.getVisualiserWidth(), 100);

	}

	/**
	 * @param dt float The delta time
 	 */
	drawSnowflakes = () => {
		//draw snow
		this.#snowflakes.forEach((s, index) => {
			s.draw(this.#context);
		});
	}

	drawSpotify = () => {

		if(this.#visualiserBars.length === 0) {
			return;
		}

		// if(!this.#spotify.isReady) {
		//
		// 	setTimeout(() => _this.drawSpotify, 1000);
			//
			// this.drawSpotify();
			// return;
		// }

		// document.getElementById('test').innerText = (new Date()).getTime();

		// this.#spotify.getCurrentlyPlaying().then(result => {
		// 	console.log(result.item.album.images[1].url);

			// this.#accessToken = result.access_token;
			// setTimeout(this.authorise, result.expires_in);

			//This is working, however draw will clear the screen every frame
			//TODO sync spotify asynchronously once per second, should be fine according to my quick goooglinh
			//TODO assume the progression of the song
			//TODO render useful data

			//draw album cover
			// const albumCoverSrc = result.item.album.images[1].url;
			if(this.#currentAlbumCover) { // || this.#currentAlbumCover.src !== albumCoverSrc) {
				this.#context.drawImage(this.#currentAlbumCover, this.getStartingXOfVisualiser(), this.#dimensions.centerY + 10, 100, 100);
			} else {
				const image = new Image(100, 100);
				image.addEventListener('load', () => {
					// dump("Draw me :)");
					this.#context.drawImage(image, this.getStartingXOfVisualiser(), this.#dimensions.centerY + 10, 100, 100);
				}, false);
				// image.src = albumCoverSrc;
				image.src = 'img/404.png';
				// image.src = 'https://i.scdn.co/image/ab67616d00001e02efe55e4449fe3cc1b1c9fd03';

				//we have to save this, otherwise te clearing of the snowflakes will mess with the rendering of the image
				//Also saves a buttload of network traffic
				this.#currentAlbumCover = image;
			}

			this.#context.font = '50px Arial Black';
			this.#context.fillStyle = 'rgb(255, 255, 255)';


			// this.#context.fontSize = '50px';
			this.#context.fillText("Constellation of Tears", this.getStartingXOfVisualiser() + this.#currentAlbumCover.width + 10, this.#dimensions.centerY + 50);

			this.#context.font = '30px Arial Black';
			this.#context.fillText("Cain's Offering", this.getStartingXOfVisualiser() + this.#currentAlbumCover.width + 10, this.#dimensions.centerY + 90);

		/*})
			.catch(_ => {
				//will also end up in here on json decode errors => if nothing is playing, ty spotify

				// console.trace();
				// console.error(JSON.stringify(_));

				dump("Errrrrr")

				// document.getElementById('test').innerText += 'error: ' + JSON.stringify(error);
				this.#context.font = '30px Arial Black';
				this.#context.fillStyle = 'rgb(255, 255, 255)';

				this.#context.fillText('Nothing is playing', this.#dimensions.centerX, this.#dimensions.centerY + 90);

			})
			 .finally(() => {
			 	setTimeout(() => this.drawSpotify, 1000);
			 });*/


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
		return ((barWidth + marginBetweenBars) * this.#visualiserBars.length);

	}

	getStartingXOfVisualiser = () => {
		return this.#dimensions.centerX - (this.getVisualiserWidth() / 2);
	}
}
