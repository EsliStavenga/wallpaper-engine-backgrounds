class CalculationService {

	/**
	 *
	 * @param x The absolute x
	 * @param y The absolute y
	 * @param coords An array with absolute values [lowerX, lowerY, upperX, upperY] in that particular order
	 */
	static isWithinBoundingBox = (x, y, coords)  =>{
		const [lowerX, lowerY, upperX, upperY] = coords;

		return (x >= lowerX && x <= upperX) &&
			(y >= lowerY && y <= upperY);
	}

}
