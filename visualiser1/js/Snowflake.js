class Snowflake {

	#position;
	#diameter;
	#gravity;
	#velocity;
	#targetY;
	#targetGravity;
	#color = 'white';
	#isConfettiEnabled = false;
	#possibleConfettiColors = ['red', 'white', 'purple', 'yellow', 'auqa', 'deeppink', 'deepskyblue', 'crimson', 'green', 'blue', 'cyan', 'orange', 'pink', 'salmon'];
	#config;

	get diameter() {
		return this.#diameter;
	}

	get posY() {
		return this.#position.y;
	}

	get posX() {
		return this.#position.x;
	}

	/**
	 * Get left coordinate of the snowflake
	 * @return {number}
	 */
	get left() {
		return this.#position.x - this.#diameter / 2;
	}

	/**
	 * Get top coordinate of the snowflake
	 * @return {number}
	 */
	get top() {
		return this.#position.y - this.#diameter / 2;
	}

	/**
	 * Get right coordinate of the snowflake
	 * @return {number}
	 */
	get right() {
		return this.#position.x + this.#diameter / 2;
	}

	/**
	 * Get bottom coordinate of the snowflake
	 * @return {number}
	 */
	get bottom() {
		return this.#position.y + this.#diameter / 2;
	}

	constructor(x = undefined, y = undefined) {
		this.#config = Config.getInstance();

		this.#diameter = randomNumber(1, 3.5);
		this.#gravity = randomNumber(-25, 25);
		this.#targetGravity = this.#gravity;
		this.#velocity = randomNumber(35, 67);
		this.toggleConfettiColored();

		const halfDiameter = this.#diameter / 2;

		if(!x || !y) {
			this.#position = new Vec2(-halfDiameter, randomNumber(halfDiameter, screen.height - halfDiameter));
		} else {
			this.#position = new Vec2(x, y);
		}

		this.#targetY = (this.#gravity > 0 ? randomNumber(this.#position.y, this.#position.y + 100) : randomNumber(this.#position.y - 100, this.#position.y));
		EventService.subscribe(EventService.CONFIG_VALUE_CHANGED, () => {
			this.toggleConfettiColored();
		});

	}

	isSafeToDestroy = () => {
		return this.isOutOfFrame();
	}

	update = (dt, speedModifier = 1) => {
		this.#position.y += this.#gravity * dt * speedModifier;
		this.#position.x += this.#velocity * dt  * speedModifier;

		//smoothly bob up and down
		if(this.#gravity !== this.#targetGravity) {
			this.#gravity += (this.#targetGravity > this.#gravity ? 10 : -10) / 100;
		}

		//bob the stars instead of just going in a straight line
		if(this.#gravity > 0 && this.#position.y >= this.#targetY || this.#gravity < 0 && this.#position.y <= this.#targetY) {
			this.#targetGravity = randomNumber(-25, 25);
			this.#targetY = (this.#gravity > 0 ? randomNumber(this.#position.y, this.#position.y + 100) : randomNumber(this.#position.y - 100, this.#position.y));
		}
	}

	toggleConfettiColored = () => {
		const newValue = this.#config.getBooleanOption('cbx_confetti');
		if(newValue === this.#isConfettiEnabled) {
			return;
		}

		this.#isConfettiEnabled = newValue;

		if(!this.#isConfettiEnabled) {
			this.#color = 'white';
		} else {
			this.#color = this.#possibleConfettiColors[Math.floor(randomNumber(0, this.#possibleConfettiColors.length-1))];
		}
	}

	draw = (context) => {
		const centerX = this.#position.x;
		const centerY = this.#position.y;
		const radius = this.#diameter;

		context.beginPath();
		context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
		context.fillStyle = this.#color;
		context.fill();
	}

	isOutOfFrame = () => {
		return this.#position.y > this.#config.dimensions.y + this.diameter || this.#position.x > this.#config.dimensions.x + this.diameter;
	}
}

