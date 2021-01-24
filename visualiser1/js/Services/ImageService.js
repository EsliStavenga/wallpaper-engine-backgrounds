class ImageService {

	static createImageFromSource(src, loadedCallback, dimensions = { width: 100, height: 100 }, dataAttributes = {}) {
		const image = new Image(dataAttributes['width'], dataAttributes['height']);

		for(const key in dataAttributes) {
			image.setAttribute(key, dataAttributes[key]);
		}

		image.addEventListener('load', loadedCallback, false);
		image.src = src;

		return image;
	}

}
