class SpotifyDataService extends Renderable {

	#isPausedImage;

	#spotify;
	#spotifyNowPlayingData;
	#spotifyProgress = 0;
	#requestLoop;

	#currentAlbumCover = undefined;
	#songTitleFontSize = 50;
	#songSubtitleFontSize = 30;
	#songDataTopMargin = 70;
	#visualiserWidth;
	#startingX;
	#imageDimensions = 100;

	set isPaused(val) {
		if(val) {
			clearInterval(this.#requestLoop);
		} else {
			this.startRequestLoop();
		}
	}

	set startingX(val) {
		this.#startingX = val;
	}

	set visualiserWidth(val) {
		this.#visualiserWidth = val;
	}

	get songDataTopMargin() {
		return this.#songDataTopMargin;
	}

	get songTitleFontSize() {
		return this.#songTitleFontSize;
	}

	get songSubtitleFontSize() {
		return this.#songSubtitleFontSize;
	}

	constructor() {
		super();

		this.#spotify = new SpotifyConnectorService();
		this.#isPausedImage = this.createAlbumCoverImage('img/paused.png', 1);

		this.startRequestLoop();

		EventService.subscribe(EventService.VISUALISER_DIMENSIONS_CHANGED, (dimensions) =>  {
			this.startingX = dimensions.startingX;
			this.visualiserWidth = dimensions.width;
		});
	}

	update = (dt) => {
		if(this.isPlayerPlaying()) {
			this.#spotifyProgress += (this.#visualiserWidth / this.#spotifyNowPlayingData.item.duration_ms * 1000 * dt);
		}
	}

	draw = (context) => {
		return new Promise((resolve) => {
			this._draw(context);

			if(!this.#spotifyNowPlayingData) {
				this.drawNothingPlaying();
			} else {
				this.drawPlayingSongData();
			}

			resolve(true);
		});
	}

	requestSpotifyData = () => {

		this.#spotify.authorise().then(() => {
			this.#spotify.getCurrentlyPlaying().then(result => {
				this.#spotifyNowPlayingData = result;
				this.#spotifyProgress = (this.#spotifyNowPlayingData.progress_ms / this.#spotifyNowPlayingData.item.duration_ms) * this.#visualiserWidth;
			})
				.catch(_ => {
					this.#spotifyNowPlayingData = undefined;
					this.#spotifyProgress = 0;
				});
		})
	}

	drawNothingPlaying = () => {
		if(this.#currentAlbumCover && this.#currentAlbumCover.hasAttribute('is-local-file') && this.#currentAlbumCover.getAttribute('is-local-file') === '1') {
			this.drawAlbumCover(this.#currentAlbumCover);
		} else {
			//we have to save this, otherwise te clearing of the snowflakes will mess with the rendering of the image
			//Also saves a buttload of network traffic

			this.#currentAlbumCover = this.createAlbumCoverImage('img/404.png', 1);
		}

		this.drawSongTitle('Nothing is playing');
		this.drawSongSubtitle('Kinda quiet :(');
	}

	drawPlayingSongData = () => {
		//draw album cover

		const item = this.#spotifyNowPlayingData.item;
		const albumCoverSrc = item.album.images[1].url;

		//only redraw the image if the source has changed
		if(this.#currentAlbumCover && this.#currentAlbumCover.src === albumCoverSrc) { // || this.#currentAlbumCover.src !== albumCoverSrc) {
			this.drawAlbumCover(this.#currentAlbumCover)
		} else {
			//we have to save this, otherwise te clearing of the snowflakes will mess with the rendering of the image
			//Also saves a buttload of network traffic
			this.#currentAlbumCover = this.createAlbumCoverImage(albumCoverSrc, 0);
		}

		this.drawSongTitle(item.name);
		this.drawSongSubtitle(item.artists.map(x => x.name).join(', '));

		this.drawProgressBar();

		//if paused show the || symbol
		if(!this.isPlayerPlaying()) {
			this.drawAlbumCover(this.#isPausedImage)
		}
	}

	isPlayerPlaying = () => {
		return this.#spotifyNowPlayingData && this.#spotifyNowPlayingData.is_playing;
	}

	resumePlayer = () => {
		if(this.#spotifyNowPlayingData) {
			this.#spotify.resume();
		}
	}

	pausePlayer = () => {
		if(this.#spotifyNowPlayingData) {
			this.#spotify.pause();
		}
	}

	nextSong = () => {
		this.#spotify.next();
	}

	previousSong = () => {
		this.#spotify.previous();
	}

	togglePlayPause = () => {
		if(!this.isPlayerPlaying()) {
			this.resumePlayer();
		} else {
			this.pausePlayer();
		}
	}

	handleClick = (e) => {
		const isClick = this.isClickOnImage(e.clientX, e.clientY);

		if(isClick) {
			this.togglePlayPause();
		}

		return isClick;
	}

	isClickOnImage = (x, y) => {
		return CalculationService.isWithinBoundingBox(x, y, this.getCoverArtPlacement(true));
	}

	drawAlbumCover = (image) => {
		const [lowerX, lowerY, upperX, upperY] = this.getCoverArtPlacement(false);

		this._context.drawImage(image, lowerX, lowerY, upperX, upperY);
	}

	drawSongTitle = (text) => {
		this.setFont(this.#songTitleFontSize);
		this._context.fillStyle = 'rgb(255, 255, 255)';

		this._context.fillText(text, this.#startingX + this.#currentAlbumCover.width + 10, this._screenDimensions.centerY + this.#songDataTopMargin);
	}

	drawSongSubtitle = (text) => {
		this.setFont(this.#songSubtitleFontSize);
		this._context.fillStyle = 'rgb(255, 255, 255)';

		this._context.fillText(text, this.#startingX + this.#currentAlbumCover.width + 10, this._screenDimensions.centerY + this.#songTitleFontSize + this.#songDataTopMargin);
	}

	setFont = (fontSize) => {
		this._context.font = `${fontSize}px Arial Black`;
	}

	createAlbumCoverImage = (src, isLocalFile = '0') => {
		return ImageService.createImageFromSource(src, () => {
		}, {
			width: this.#imageDimensions,
			height: this.#imageDimensions
		}, {
			'is-local-file': isLocalFile.toString(),
			'height': this.#imageDimensions,
			'width': this.#imageDimensions
		});
	}

	drawProgressBar = () => {
		this._context.fillStyle = this._config.createVisualiserGradient(this._context, new Vec2(this.#startingX,  this._screenDimensions.centerY), new Vec2(this._screenDimensions.x, this._screenDimensions.centerY));
		this._context.fillRect(this.#startingX, this._screenDimensions.centerY + 1 , clamp(this.#spotifyProgress, 0, this.#visualiserWidth), 5);
	}

	startRequestLoop = () => {
		this.#requestLoop = setInterval(this.requestSpotifyData, 1000);
	}

	/**
	 *
	 * @param isAbsolute Whether to return absolute or relative values
	 * @return {(*|number)[]}
	 */
	getCoverArtPlacement = (isAbsolute = false) => {
		const lowerX = this.#startingX;
		const lowerY = this._screenDimensions.centerY + 30;

		let upperX = (isAbsolute ? lowerX : 0 ) + this.#imageDimensions;
		let upperY = (isAbsolute ? lowerY : 0 ) + this.#imageDimensions;

		return [
			lowerX,
			lowerY,
			upperX,
			upperY
		];
	}
}
