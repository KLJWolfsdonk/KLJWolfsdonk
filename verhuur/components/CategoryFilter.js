import { escapeHtml } from "../../src/shared/helpers.js";


export class CategoryFilter {


	constructor(container, onChange) {

		this.container = container;
		this.onChange = onChange;

		this.categories = [];
		this.selected = "alle";

	}




	setCategories(categories) {

		this.categories = categories;

		this.render();

	}




	render() {


		this.container.innerHTML = `

			<label class="field-group">

				<span>Categorie</span>

				<select id="category-select">

					<option value="alle">
						Alle categorieën
					</option>

					${
						this.categories.map(category => `

							<option
								value="${escapeHtml(category)}"
								${category === this.selected ? "selected" : ""}
							>
								${escapeHtml(category)}
							</option>

						`).join("")
					}

				</select>

			</label>

		`;



		this.container
			.querySelector("#category-select")
			.addEventListener(
				"change",
				event => {

					this.selected = event.target.value;

					this.onChange(this.selected);

				}
			);

	}

}
