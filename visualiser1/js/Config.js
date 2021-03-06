class Config {

	defaultColorOption = '0.76470588235 0.76470588235 0.76470588235';
	#config = {};

	static #instance = undefined;

	get config() {
		return this.#config;
	}

	set config(values) {
		Object.assign(this.#config, values);
		EventService.fire(EventService.CONFIG_VALUE_CHANGED);
	}

	set dimensions(value) {
		this.config['dimensions'] = value;
		EventService.fire(EventService.SCREEN_RESIZE, value);
	}

	get dimensions() {
		return this.config['dimensions'];
	}

	/**
	 * A singleton for the config, so all code has the same instance and the most up-to-date config options
	 *
	 * @return {self} An instance of Config
	 */
	static getInstance = () => {
		if(!this.#instance) {
			this.#instance = new this();
		}

		return this.#instance;
	}

	/**
	 * Check if an option exists
	 *
	 * @param {string} option The config option
	 * @return {boolean} True if the key exists, false otherwise
	 */
	hasConfigOption = (option) => {
		return !!(this.config[option]);
	}

	/**
	 * Get's the value from the config and formats it properly for CSS
	 * E.g. 1 1 0 is turned into rgb(255, 255, 0)
	 *
	 * @param {string} option The config option
	 * @return {string} rgb(r, g ,b)
	 */
	getColorOption = (option) => {
		const value = this.config[option]?.value ?? this.defaultColorOption;
		const normalizedArray = value.split(' ');
		const rgbArray = normalizedArray.map(x => Math.round(x * 255));

		return `rgb(${rgbArray[0]}, ${rgbArray[1]}, ${rgbArray[2]})`;

	}

	/**
	 * Returns the value, or the default value of the value does not exist
	 *
	 * @param {string} option The name of the option
	 * @param {string|boolean|int} [_default=''] The default value to return
	 * @return {string} The value of the config optoin
	 */
	getConfigOption = (option, _default = '') => {
		return this.config[option]?.value || _default;
	}

	getBooleanOption = (option) => {
		return this.getConfigOption(option).toString() === 'true';
	}

	/**
	 *
	 * @param {CanvasRenderingContext2D} context The context the gradient will be drawn on
	 * @param {Vec2} position
	 * @param {Vec2} dimensions
	 *
	 * @return {CanvasGradient}
	 */
	createVisualiserGradient = (context, position, dimensions) => {
		const gradient = context.createLinearGradient(position.x, position.centerY, dimensions.x - position.x, dimensions.centerY);
		gradient.addColorStop(0, this.getColorOption('cp_gradient_bar_0'));
		gradient.addColorStop(0.25, this.getColorOption('cp_gradient_bar_1'));
		gradient.addColorStop(0.5,  this.getColorOption('cp_gradient_bar_2'));
		gradient.addColorStop(0.75,  this.getColorOption('cp_gradient_bar_3'));

		return gradient;
	}

}
