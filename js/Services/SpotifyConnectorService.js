class SpotifyConnectorService {

	#isReady = false;
	#config;
	#accessToken = new AccessToken();

	get isReady() {
		return this.#isReady;
	}

	constructor() {
		this.#config = Config.getInstance();
		this.authorise();
	}

	authorise() {
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

		// document.getElementById('test').innerText += 'testest';

		return fetch('https://accounts.spotify.com/api/token', requestOptions)
			.then(response => response.json())
			.then(result => {
				this.#accessToken.accessToken = result.access_token;
				this.#accessToken.expiresIn = result.expires_in;


			})
			.catch(error => {
				console.log('error', error)
				document.getElementById('test').innerText += JSON.stringify(this.#accessToken);
			} );
	}

	getCurrentlyPlaying() {

		return new Promise((resolve) => {
			this.authorise().then(() => {
				const requestOptions = {
					method: 'GET',
					headers: this.getHeaders(),
					// body: this.getAuthBody(),
					redirect: 'follow'
				};

				fetch('https://api.spotify.com/v1/me/player/currently-playing?market=ES', requestOptions)
					.then(response => resolve(response.json()));
			});
		});


	}

	getAuthToken() {
		if(this.#accessToken && !this.#accessToken.hasExpired()) {
			return `Bearer ${this.#accessToken.accessToken}`;
		}

		return `Basic ${btoa(`${this.#config.getConfigOption('clientid', 'b7126d28442c46a686cbce54e7d81790')}:${this.#config.getConfigOption('clientsecret', '2845ee9a128742939fb0339a16579223')}`)}`;
	}

	getHeaders() {
		const headers = new Headers();
		headers.append("Authorization", this.getAuthToken());
		headers.append("Accept", 'application/json');
		headers.append("Content-Type", "application/x-www-form-urlencoded");

		return headers;
	}

	getAuthBody() {
		return this.buildBody({
			refresh_token: this.#accessToken.refreshToken,
			grant_type: 'refresh_token'
		});
	}

	/**
	 *
	 * @param data An object with data {key: value, scope: 'user-read-playback-state'}
	 */
	buildBody(data) {
		const params = new URLSearchParams();

		for(const key in data) {
			params.append(key, data[key]);
		}

		return params;
	}
}
