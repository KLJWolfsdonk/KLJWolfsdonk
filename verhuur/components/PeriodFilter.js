export class PeriodFilter {

	constructor(container, onChange) {
		this.container = container;
		this.onChange = onChange;
	}


	render() {

		this.container.innerHTML = `

			<div class="inline-fields">

				<label class="field-group">
					<span>Startdatum</span>
					<input
						id="start-date"
						type="date"
					>
				</label>



				<label class="field-group">
					<span>Einddatum</span>
					<input
						id="end-date"
						type="date"
					>
				</label>

			</div>

		`;


		const start =
			this.container.querySelector("#start-date");


		const end =
			this.container.querySelector("#end-date");



		start.value = "2026-08-01";

		end.value = "2026-08-03";



		const update = () => {

			this.onChange({

				startDatum: start.value,

				eindDatum: end.value

			});

		};



		start.addEventListener(
			"change",
			update
		);


		end.addEventListener(
			"change",
			update
		);

	}

}
