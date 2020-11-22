class ScreenManager {

	stars = [];
	maxStarCount;
	context;
	lastFrameDateTime;
	audio = [];
	_config = new Config();

	get config() {
		return this._config;
	}

	set config(config) {
		this._config.config = config;
	}

	constructor(maxStarCount = 200) {
		this.maxStarCount = maxStarCount;
		this.createCanvas();

		this.draw();
	}


	draw = () => {
		requestAnimationFrame(this.draw);

		const now = this.timestamp();
		const dt = (now - this.lastFrameDateTime) / 1000;
		this.lastFrameDateTime = now;

		this.generateStars(dt);
		this.render(dt);
	}

	timestamp = () => {
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
		this.context.clearRect(0, 0, window.innerWidth, window.innerHeight);
	}

	createCanvas = () => {
		const canvas = document.createElement('canvas');
		canvas.height = window.innerHeight;
		canvas.width = window.innerWidth;

		this.context = canvas.getContext('2d');

		document.body.append(canvas);
	}

	render = (dt) => {
		this.clearScreen();
		this.drawSynthesizer();

		//draw stars
		this.stars.forEach((s, index) => {
			if(s.isSafeToDestroy()) {
				this.stars.splice(index, 1); //remove the star if out of bounds
				return;
			}

			s.update(dt);
			s.draw(this.context);
		});
	}

	drawSynthesizer() {
		const barWidth = 5;
		const halfCount = this.audio.length / 2;

		this.context.fillStyle = this.config.getColorOption('cp_visualiser');
		// this.context.fillRect(250, 250, 10, 10);

		//first half = left
		//second half = right
		for (let i = 0; i < halfCount; ++i) {
			var height = window.innerHeight * this.audio[i];

			document.getElementById('test').innerText = (height + this.audio[i] * 2000);
			this.context.fillRect(barWidth * i, window.innerHeight - height, barWidth, height);
		}
	}

}
