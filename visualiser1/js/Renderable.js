class Renderable {

	/**
	 * Protected fields aren't supported yet ;-;
	 *
	 * @protected
	 */
	_config;
	_context;
	_screenDimensions;

	constructor() {
		this._config = Config.getInstance();

		EventService.subscribe(EventService.SCREEN_RESIZE, (dimensions) => {
			this._screenDimensions = dimensions;
		});
	}

	//apparently is object inheritance kinda hacky in JS so I wanted to call this draw
	//and the let the child call it with super.draw()
	//however JS wasn't too into that, this prefix is kinda a workaround
	_draw = (context) => {
		this._context = context;
	}
}
