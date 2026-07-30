import { toDateInputValue } from "../../src/shared/helpers.js";


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



		const today =
			new Date();

		const tomorrow =
			new Date(today.getTime() + 24 * 60 * 60 * 1000);

		const todayValue =
			toDateInputValue(today);



		// Dates in the past aren't bookable — the browser's native date
		// picker enforces this via `min`, but it doesn't stop someone from
		// typing/pasting a past date, so verhuur.js validates again before
		// submitting.
		start.min = todayValue;

		start.value = todayValue;

		end.min = toDateInputValue(tomorrow);

		end.value = toDateInputValue(tomorrow);



		const update = () => {

			this.onChange({

				startDatum: start.value,

				eindDatum: end.value

			});

		};



		start.addEventListener(
			"change",
			() => {

				// Whenever the start date changes, default the end date to
				// one day later — most people expect a fresh, valid end
				// date rather than having to re-pick it every time.
				const dayAfterStart =
					new Date(
						new Date(start.value).getTime() + 24 * 60 * 60 * 1000
					);

				const minEnd =
					start.value;

				end.min = minEnd;

				end.value = toDateInputValue(dayAfterStart);

				update();

			}
		);


		end.addEventListener(
			"change",
			update
		);

	}

}
