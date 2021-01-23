class ImageService {

	static createImageFromSource(src, loadedCallback, dataAttributes = {}) {
		const image = new Image(100, 100);

		for(const key in dataAttributes) {
			image.setAttribute(key, dataAttributes[key]);
		}

		image.addEventListener('load', loadedCallback, false);
		image.src = src;

		return image;
	}

}
