export class SearchFilter {


	constructor(container, onChange) {

		this.container = container;
		this.onChange = onChange;

	}




	render() {


		this.container.innerHTML = `

			<label class="field-group">

				<span>Zoeken</span>

				<input
					id="search-input"
					type="search"
					placeholder="Zoek op naam of beschrijving..."
				>

			</label>

		`;



		this.container
			.querySelector("#search-input")
			.addEventListener(
				"input",
				event => {

					this.onChange(event.target.value);

				}
			);

	}

}
