class Star {

	position;
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
		this.position = new Vec2(-halfDiameter, randomNumber(halfDiameter , screen.height - halfDiameter));

		this.targetY = (this.gravity > 0 ? randomNumber(this.position.y, this.position.y + 100) : randomNumber(this.position.y - 100, this.position.y));
	}

	isSafeToDestroy() {
		return this.isOutOfFrame();
	}

	update = (dt) => {
		this.position.y += this.gravity * dt;
		this.position.x += this.velocity * dt;

		if(this.gravity !== this.targetGravity) {
			this.gravity += (this.targetGravity > this.gravity ? 10 : -10) / 100;
		}

		//bob the stars instead of just going in a straight line
		if(this.gravity > 0 && this.position.y >= this.targetY || this.gravity < 0 && this.position.y <= this.targetY) {
			//smooth this
			this.targetGravity = randomNumber(-25, 25);
			this.targetY = (this.gravity > 0 ? randomNumber(this.position.y, this.position.y + 100) : randomNumber(this.position.y - 100, this.position.y));
		}
	}

	draw = (context) => {
		const centerX = this.position.x;
		const centerY = this.position.y;
		const radius = this.diameter;

		context.beginPath();
		context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
		context.fillStyle = 'white';
		context.fill();
	}

	isOutOfFrame() {
		return this.position.y > screen.height || this.position.x > screen.width;
	}
}

