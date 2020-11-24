class Config {

	defaultColorOption = '0.76470588235 0.76470588235 0.76470588235';
	#config = {};

	static #instance = undefined;

	get config() {
		return this.#config;
	}

	set config(values) {
		Object.assign(this.#config, values);
	}

	constructor() {
	}

	static getInstance() {
		if(!this.#instance) {
			this.#instance = new this();
		}

		return this.#instance;
	}

	/**
	 * Get's the value from the config and parses it
	 * E.g. 1 1 0 is turned into rgb(255, 255, 0)
	 *
	 * @param option The config option
	 * @return {string} rgb(r, g ,b)
	 */
	getColorOption(option) {
		const value = this.config[option]?.value ?? this.defaultColorOption;
		const normalizedArray = value.split(' ');
		const rgbArray = normalizedArray.map(x => Math.round(x * 255));

		return `rgb(${rgbArray[0]}, ${rgbArray[1]}, ${rgbArray[2]})`;

	}

	getConfigOption(option, _default = '') {
		return this.config[option]?.value ?? _default;
	}


}
