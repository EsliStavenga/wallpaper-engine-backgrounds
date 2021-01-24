class EventService {

	static #listeners = [];
	static get SCREEN_RESIZE() { return 'screen-resize'; };
	static get CONFIG_VALUE_CHANGED() { return 'config-value-changed'; };
	static get AUDIO_VALUE_CHANGED() { return 'audio-value-changed'; };
	static get VISUALISER_DIMENSIONS_CHANGED() { return 'visualiser-dimensions-changed'; };

	static subscribe(name, callback) {
		if(!this.#listeners[name]) {
			this.#listeners[name] = [];
		}

		this.#listeners[name].push(callback);
	}

	static fire(name, ...values) {
		if(!this.#listeners[name]) {
			return;
		}

		this.#listeners[name].forEach(callback => {
			callback(...values);
		})
	}

}
