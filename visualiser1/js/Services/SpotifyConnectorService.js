class SpotifyConnectorService {

	#isReady = false;
	#config;
	#accessToken = new AccessToken();
	#basePlayerURL  = 'https://api.spotify.com/v1/me/player';

	get isReady() {
		return this.#isReady;
	}

	constructor() {
		this.#config = Config.getInstance();

		EventService.subscribe(EventService.CONFIG_VALUE_CHANGED, () => {
			if(this.#config.hasConfigOption('txt_spotify_refresh_token')) {
				this.#accessToken.refreshToken = this.#config.getConfigOption('txt_spotify_refresh_token');
				this.authorise();
			}
		});
	}

	resume = () => {
		return new Promise((resolve, reject) => {
			this.sendRequest(`${this.#basePlayerURL}/play`,'PUT', resolve, reject);
		});
	}

	pause = () => {
		return new Promise((resolve, reject) => {
			this.sendRequest(`${this.#basePlayerURL}/pause`,'PUT', resolve, reject);
		});
	}

	next = () => {
		return new Promise((resolve, reject) => {
			this.sendRequest(`${this.#basePlayerURL}/next`, 'POST', resolve, reject);
		});
	}

	previous = () => {
		return new Promise((resolve, reject) => {
			this.sendRequest(`${this.#basePlayerURL}/previous`, 'POST', resolve, reject);
		});
	}

	/**
	 * Get a new access token
	 *
	 * @return {Promise<undefined>|Promise<undefined>}
	 */
	authorise = () => {
		if(this.#accessToken && !this.#accessToken.hasExpired()) {
			return new Promise(r => r());
		}

		this.#isReady = false;

		const requestOptions = {
			method: 'POST',
			headers: this.getHeaders(),
			body: this.getAuthBody(),
			redirect: 'follow'
		};

		return fetch('https://accounts.spotify.com/api/token', requestOptions)
			.then(response => response.json())
			.then(result => {
				this.#accessToken.accessToken = result.access_token;
				this.#accessToken.expiresIn = result.expires_in;

			})
			.catch(error => {
				console.log('error', error)
			} );
	}

	/**
	 * Gets the currently playing song data from spotify
	 *
	 * @return {Promise<string>} The response data in JSON format
	 */
	getCurrentlyPlaying = () => {

		return new Promise((resolve, reject) => {
			this.authorise().then(() => {
				this.sendRequest(`${this.#basePlayerURL}/currently-playing?market=NL`,'GET', resolve, reject);
			});
		});
	}

	sendRequest = (url, method, resolve, reject) => {
		const requestOptions = {
			method: method,
			headers: this.getHeaders(),
			redirect: 'follow'
		};

		fetch(url, requestOptions)
			.then(response => {
				response.json().then(json => resolve(json)).catch(e => reject(e));
			});
	}

	/**
	 * Gets the Bearer token header if the access token is valid, or the Basic header if the access token is not valid
	 * @return {string}
	 */
	getAuthToken = () => {
		if(this.#accessToken && !this.#accessToken.hasExpired()) {
			return `Bearer ${this.#accessToken.accessToken}`;
		}

		return `Basic ${btoa(`${this.#config.getConfigOption('clientid', 'b7126d28442c46a686cbce54e7d81790')}:${this.#config.getConfigOption('clientsecret', '5b03c385f0e5486ebd69cedc81b3fe18')}`)}`;
	}

	/**
	 * Get all the relevant headers for Spotify
	 *
	 * @return {Headers}
	 */
	getHeaders = () => {
		const headers = new Headers();
		headers.append("Authorization", this.getAuthToken());
		headers.append("Accept", 'application/json');
		headers.append("Content-Type", "application/x-www-form-urlencoded");

		return headers;
	}

	/**
	 * Get the JSON body for spotify Auth
	 *
	 * @return {URLSearchParams}
	 */
	getAuthBody = () => {
		return this.buildBody({
			refresh_token: this.#accessToken.refreshToken,
			grant_type: 'refresh_token'
		});
	}

	/**
	 * @param data An object with data {key: value, scope: 'user-read-playback-state'}
	 * @return {URLSearchParams} The body for the fetch function
	 */
	buildBody = (data) => {
		const params = new URLSearchParams();

		for(const key in data) {
			params.append(key, data[key]);
		}

		return params;
	}
}
