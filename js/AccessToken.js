class AccessToken {

	#accessToken = localStorage.getItem('access-token');
	#refreshToken = localStorage.getItem('refresh-token');
	#expiresIn = 600;
	expiresAt = undefined;

	set accessToken(val) {
		this.#accessToken = val;
		localStorage.setItem('access-token', val)
	}

	//FIXME uncertain this works
	get accessToken() {
		return this.#accessToken || Config.getInstance().getConfigOption('txt_spotify_access_token');
	}

	set refreshToken(val) {
		this.#refreshToken = val;
		localStorage.setItem('refresh-token', val);
	}

	get refreshToken() {
		return this.#refreshToken || Config.getInstance().getConfigOption('txt_spotify_refresh_token');
	}

	get expiresIn() {
		return this.#expiresIn;
	}

	set expiresIn(val) {
		this.#expiresIn = val;
		this.expiresAt = (new Date((new Date()).getTime() + (1000 * val)));
	}

	hasExpired = () => {
		return !this.expiresAt || this.expiresAt <= (new Date()).getTime();
	}

}
