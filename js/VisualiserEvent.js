class VisualiserEvent {

	#listeners = [];

	/**
	 * Synonym for addListener
	 *
	 * @see addListener
	 * @param callback
	 */
	add(callback) {
		this.addListener(callback);
	}

	/**
	 * Adds a callback function to be called whenever this::call is called
	 *
	 * @see call
	 * @param {function} callback The method to be called
	 */
	addListener(callback) {
		if(typeof callback !== 'function') {
			throw new Error('Callback must be callable (a function)');
		}

		this.#listeners.push(callback);
	}

	call(value) {
		this.#listeners.forEach((listener) => {
			listener(value);
		});
	}

}
