class SpotifyDataService {

	#isPausedImage;
	#context;
	#screenDimensions;

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

	constructor(screenDimensions) {
		this.#spotify = new SpotifyConnectorService();
		this.#screenDimensions = screenDimensions;
		this.#isPausedImage = this.createAlbumCoverImage('img/paused.png', 1);

		this.startRequestLoop();
	}

	update = (dt) => {
		if(this.isPlayerPlaying()) {
			this.#spotifyProgress += (this.#visualiserWidth / this.#spotifyNowPlayingData.item.duration_ms * 1000 * dt);
		}
	}

	draw = (context) => {
		this.#context = context;

		// dump(this.#spotifyNowPlayingData);

		if(!this.#spotifyNowPlayingData) {
			this.drawNothingPlaying();
		} else {
			this.drawPlayingSongData();
		}
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



	togglePlayPause = () => {
		if(!this.isPlayerPlaying()) {
			this.resumePlayer();
		} else {
			this.pausePlayer();
		}
	}

	isClickOnImage = (x, y) => {
		return (x >= this.#startingX && x <= this.#startingX + this.#imageDimensions ) &&
			(y >= this.#screenDimensions.centerY && y <= this.#screenDimensions.centerY + this.#imageDimensions);
	}

	drawAlbumCover = (image) => {
		this.#context.drawImage(image, this.#startingX, this.#screenDimensions.centerY + 30, this.#imageDimensions, this.#imageDimensions);
	}

	drawSongTitle = (text) => {
		this.setFont(this.#songTitleFontSize);
		this.#context.fillStyle = 'rgb(255, 255, 255)';

		this.#context.fillText(text, this.#startingX + this.#currentAlbumCover.width + 10, this.#screenDimensions.centerY + this.#songDataTopMargin);
	}

	drawSongSubtitle = (text) => {
		this.setFont(this.#songSubtitleFontSize);
		this.#context.fillStyle = 'rgb(255, 255, 255)';

		this.#context.fillText(text, this.#startingX + this.#currentAlbumCover.width + 10, this.#screenDimensions.centerY + this.#songTitleFontSize + this.#songDataTopMargin);
	}

	setFont = (fontSize) => {
		this.#context.font = `${fontSize}px Arial Black`;
	}

	createAlbumCoverImage = (src, isLocalFile = '0') => {
		const image = new Image(100, 100);
		image.addEventListener('load', () => {
			this.drawAlbumCover(image)
		}, false);
		image.setAttribute('is-local-file', isLocalFile.toString());
		image.src = src;

		return image;
	}

	drawProgressBar = () => {
		this.#context.fillStyle = Config.getInstance().createVisualiserGradient(this.#context, new Vec2(this.#startingX,  this.#screenDimensions.centerY), new Vec2(this.#screenDimensions.x, this.#screenDimensions.centerY));
		this.#context.fillRect(this.#startingX, this.#screenDimensions.centerY + 1 , clamp(this.#spotifyProgress, 0, this.#visualiserWidth), 5);
	}

	startRequestLoop = () => {
		this.#requestLoop = setInterval(this.requestSpotifyData, 1000);
	}
}
