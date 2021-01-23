/**
 * The access and refresh token
 * Setters and getters are used so localstorage is set on change
 * This will ensure the refreshtoken is kept in between pc restarts
 */
class AccessToken {

	#accessToken = localStorage.getItem('access-token');
	#refreshToken = localStorage.getItem('refresh-token');
	#expiresIn = 600;
	expiresAt = undefined;

	set accessToken(val) {
		this.#accessToken = val;

		if(val) {
			localStorage.setItem('access-token', val)
		}
	}

	get accessToken() {
		return this.#accessToken || Config.getInstance().getConfigOption('txt_spotify_access_token', 'BQCWLk1MPMoAe7-Eqo_PPUVubIxlhMM7X-F3jGTVae-kHRxzyQsR1qfc9uAJ7DmuHJ1uQPuqKKsfD5Pu4aCA9b4hFtE6TmMGjym_-DO1LeYV3gsw7lq-beOy_Q85f9fxYxbTc5uUzshLLlX-adCfxuSa6wFSvmZMmInSYv7-9eIqhQg');
	}

	set refreshToken(val) {
		this.#refreshToken = val;

		if(val) {
			localStorage.setItem('refresh-token', val);
		}
	}

	get refreshToken() {
		return this.#refreshToken || Config.getInstance().getConfigOption('txt_spotify_refresh_token', 'AQBigH7rvRj-LcPQpp6CPkAOD1RfvZYessC1Oe9aLx9yEViqim0_vV7PZRot-8XgIKrT3hINNNGMVkjY0DuZz4lu6PGRqWfo-ssm-9hvtqXIQfnvMo-btpk8Um1BvWsRx2c');
	}

	get expiresIn() {
		return this.#expiresIn;
	}

	set expiresIn(val) {
		this.#expiresIn = val;
		this.expiresAt = (new Date((new Date()).getTime() + (1000 * val)));
	}

	hasExpired = () => {
		return !this.accessToken || !this.expiresAt || this.expiresAt <= (new Date()).getTime();
	}

}
