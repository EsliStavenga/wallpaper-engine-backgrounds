class Config {

	defaultColorOption = '0.76470588235 0.76470588235 0.76470588235';
	#config = {};
	#valueChangedEvent = new VisualiserEvent();

	static #instance = undefined;

	/**
	 * Add an EventListener to be called whenever a config option changes
	 * @param {function} callback The function to be called
	 */
	set onConfigChanged(callback) {
		this.#valueChangedEvent.addListener(callback);
	}

	get config() {
		return this.#config;
	}

	set config(values) {
		Object.assign(this.#config, values);
		this.#valueChangedEvent.call(null);
	}

	constructor() {
	}

	/**
	 * A singleton for the config, so all code has the same instance and the most up-to-date config options
	 *
	 * @return {self} An instance of Config
	 */
	static getInstance() {
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
	hasConfigOption(option) {
		return !!(this.config[option]);
	}

	/**
	 * Get's the value from the config and formats it properly for CSS
	 * E.g. 1 1 0 is turned into rgb(255, 255, 0)
	 *
	 * @param {string} option The config option
	 * @return {string} rgb(r, g ,b)
	 */
	getColorOption(option) {
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
	getConfigOption(option, _default = '') {
		return this.config[option]?.value || _default;
	}


}
