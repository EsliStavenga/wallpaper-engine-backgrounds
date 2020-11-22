class Star {

	x;
	y;
	diameter;
	gravity;
	velocity;
	targetY;
	targetGravity;

	constructor() {
		this.diameter = randomNumber(1, 3.5);
		this.gravity = randomNumber(-25, 25);
		this.targetGravity = this.gravity;
		this.velocity = randomNumber(35, 67);

		const halfDiameter = this.diameter / 2;

		this.x = -halfDiameter ;
		this.y = randomNumber(halfDiameter , screen.height - halfDiameter);
		this.targetY = (this.gravity > 0 ? randomNumber(this.y, this.y + 100) : randomNumber(this.y - 100, this.y));
	}

	isSafeToDestroy() {
		return this.isOutOfFrame();
	}

	update = (dt) => {
		this.y += this.gravity * dt;
		this.x += this.velocity * dt;

		if(this.gravity !== this.targetGravity) {
			this.gravity += (this.targetGravity > this.gravity ? 10 : -10) / 100;
		}

		//bob the stars instead of just going in a straight line
		if(this.gravity > 0 && this.y >= this.targetY || this.gravity < 0 && this.y <= this.targetY) {
			//smooth this
			this.targetGravity = randomNumber(-25, 25);
			this.targetY = (this.gravity > 0 ? randomNumber(this.y, this.y + 100) : randomNumber(this.y - 100, this.y));
		}
	}

	draw = (context) => {
		const centerX = this.x;
		const centerY = this.y;
		const radius = this.diameter;

		context.beginPath();
		context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
		context.fillStyle = 'white';
		context.fill();
	}

	isOutOfFrame() {
		return this.y > screen.height || this.x > screen.width;
	}
}

