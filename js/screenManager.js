class ScreenManager {

	stars = [];
	maxStarCount;
	context;
	lastFrameDateTime;
	audio = [];
	_config = new Config();
	dimensions;
	visualiserBarsGradient;

	get config() {
		return this._config;
	}

	set config(config) {
		this._config.config = config;
		this.recalculateVisualiserBarsGradient();
	}

	constructor(maxStarCount = 200) {
		this.maxStarCount = maxStarCount;
		this.reset();
		this.createCanvas();
		this.recalculateVisualiserBarsGradient();

		this.draw();
	}


	draw = () => {
		requestAnimationFrame(this.draw);

		const now = this.getTimestamp();
		const dt = (now - this.lastFrameDateTime) / 1000;
		this.lastFrameDateTime = now;

		this.generateStars(dt);
		this.render(dt);
	}

	getTimestamp = () => {
		return window.performance && window.performance.now ? window.performance.now() : new Date().getTime();
	}

	generateStars = () => {
		if(this.stars.length === this.maxStarCount) {
			return;
		}

		for(let i = this.stars.length; i < this.maxStarCount; i++) {
			if(randomNumber(0, 1) > 0.9999) { //very low probability to generate a star
				this.stars.push(new Star());

				//generate a max of 1 star per frame
				return;
			}
		}
	}

	clearScreen = () => {
		this.context.clearRect(0, 0, this.dimensions.x, this.dimensions.y);
	}

	createCanvas = () => {
		const canvas = document.createElement('canvas');
		canvas.width = this.dimensions.x;
		canvas.height = this.dimensions.y;

		document.body.append(canvas);
		this.context = canvas.getContext('2d');
	}

	render = (dt) => {
		this.clearScreen();

		//draw snow
		this.stars.forEach((s, index) => {
			if(s.isSafeToDestroy()) {
				this.stars.splice(index, 1); //remove the snowflake if out of bounds
				return;
			}

			s.update(dt);
			s.draw(this.context);
		});

		//draw synthesizer after snow
		this.drawSynthesizer();
	}

	drawSynthesizer() {
		const barWidth = this.config.getConfigOption('slider_bar_width', 15);
		const marginBetweenBars = this.config.getConfigOption('slider_bar_margin', 3);
		const audioCount = this.audio.length;
		const halfCount = audioCount / 2;
		const centerY = this.dimensions.centerY;
		const centerX = this.dimensions.centerX;

		//calculate the starting position of the first bar
		const startX = centerX - ((barWidth * halfCount) / 2) - (marginBetweenBars * (halfCount / 2));
		this.context.fillStyle = this.visualiserBarsGradient;

		// this.context.fillStyle = this.config.getColorOption('cp_visualiser');
		//only draw every other bar

		for (let i = 0; i < halfCount; i++) {
			const height = centerY * this.audio[i] * 2;
			//x = startX + (width of the bar * the number of bars) + (marginBetweenBars * the number of bars)
			//y = center of screen - the height of the bar
			//width = width of bar
			//height = height of bar or 1 if 0

			document.getElementById('test').innerText = JSON.stringify(this.visualiserBarsGradient);
			this.context.fillRect(startX + (barWidth * i) + (marginBetweenBars * i), centerY - height, barWidth, Math.max(height, 1));
		}
	}

	reset = () => {
		this.dimensions = new Vec2(window.innerWidth, window.innerHeight);
	}

	recalculateVisualiserBarsGradient = () => {
		const barWidth = this.config.getConfigOption('slider_bar_width', 15);
		const marginBetweenBars = this.config.getConfigOption('slider_bar_margin', 3);
		const halfCount = this.audio.length / 2;

		const startX = this.dimensions.centerX - ((barWidth * halfCount) / 2) - (marginBetweenBars * (halfCount / 2));

		const gradient = this.context.createLinearGradient(startX, this.dimensions.centerY, this.dimensions.x - startX, this.dimensions.centerY);
		gradient.addColorStop(0,  this.config.getColorOption('cp_gradient_bar_0'));
		gradient.addColorStop(0.25,  this.config.getColorOption('cp_gradient_bar_1'));
		gradient.addColorStop(0.5,  this.config.getColorOption('cp_gradient_bar_2'));
		gradient.addColorStop(0.75,  this.config.getColorOption('cp_gradient_bar_3'));

		// document.getElementById('test2').innerHTML += JSON.stringify(this)  + '<br />';

		this.visualiserBarsGradient = gradient;
	}
}
