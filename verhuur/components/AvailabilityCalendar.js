const MONTH_NAMES = [
	"januari", "februari", "maart", "april", "mei", "juni",
	"juli", "augustus", "september", "oktober", "november", "december"
];

const WEEKDAY_LABELS = ["ma", "di", "wo", "do", "vr", "za", "zo"];


export class AvailabilityCalendar {


	constructor(container, { voorraad = 0, bookedRanges = [] } = {}) {

		this.container = container;
		this.voorraad = voorraad;
		this.bookedRanges = bookedRanges;

		const today = new Date();

		this.viewYear = today.getFullYear();
		this.viewMonth = today.getMonth();

	}




	render() {


		const firstOfMonth =
			new Date(this.viewYear, this.viewMonth, 1);

		const daysInMonth =
			new Date(this.viewYear, this.viewMonth + 1, 0).getDate();

		const startOffset =
			(firstOfMonth.getDay() + 6) % 7;


		const cells = [];


		for (let i = 0; i < startOffset; i++) {

			cells.push(
				`<span class="calendar-cell calendar-cell--empty"></span>`
			);

		}


		for (let day = 1; day <= daysInMonth; day++) {

			const date =
				new Date(this.viewYear, this.viewMonth, day);

			const booked =
				this._bookedQuantity(date);

			const modifier =
				this.voorraad <= 0 || booked >= this.voorraad
					? "booked"
					: booked > 0
						? "partial"
						: "free";

			const label =
				modifier === "booked"
					? "Volzet"
					: modifier === "partial"
						? "Beperkt beschikbaar"
						: "Vrij";

			cells.push(
				`<span class="calendar-cell calendar-cell--${modifier}" title="${label}">${day}</span>`
			);

		}


		this.container.innerHTML = `

			<div class="calendar">

				<div class="calendar-header">

					<button type="button" class="calendar-nav" data-dir="-1" aria-label="Vorige maand">&larr;</button>

					<strong>${MONTH_NAMES[this.viewMonth]} ${this.viewYear}</strong>

					<button type="button" class="calendar-nav" data-dir="1" aria-label="Volgende maand">&rarr;</button>

				</div>

				<div class="calendar-weekdays">
					${WEEKDAY_LABELS.map(label => `<span>${label}</span>`).join("")}
				</div>

				<div class="calendar-grid">
					${cells.join("")}
				</div>

				<div class="calendar-legend">
					<span><span class="calendar-cell calendar-cell--free" aria-hidden="true"></span> Vrij</span>
					<span><span class="calendar-cell calendar-cell--partial" aria-hidden="true"></span> Beperkt</span>
					<span><span class="calendar-cell calendar-cell--booked" aria-hidden="true"></span> Volzet</span>
				</div>

			</div>

		`;


		this._bindNav();

	}




	_bindNav() {

		this.container
			.querySelectorAll(".calendar-nav")
			.forEach(button => {

				button.addEventListener(
					"click",
					() => {

						const direction =
							Number(button.dataset.dir);

						this.viewMonth += direction;

						if (this.viewMonth < 0) {
							this.viewMonth = 11;
							this.viewYear -= 1;
						}

						if (this.viewMonth > 11) {
							this.viewMonth = 0;
							this.viewYear += 1;
						}

						this.render();

					}
				);

			});

	}




	_bookedQuantity(date) {

		const time = date.getTime();

		return this.bookedRanges.reduce((total, range) => {

			const start =
				new Date(range.startDatum).setHours(0, 0, 0, 0);

			const end =
				new Date(range.eindDatum).setHours(0, 0, 0, 0);

			if (Number.isNaN(start) || Number.isNaN(end)) {
				return total;
			}

			return time >= start && time <= end
				? total + (range.quantity ?? 1)
				: total;

		}, 0);

	}

}
