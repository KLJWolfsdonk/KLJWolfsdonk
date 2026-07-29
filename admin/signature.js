import { supabase }
from "../src/shared/supabase.js";


const logoutButton =
	document.getElementById(
		"logout-button"
	);


const canvas =
	document.getElementById(
		"signature-pad"
	);


const ctx = canvas.getContext("2d");

ctx.lineWidth = 2;
ctx.lineCap = "round";
ctx.strokeStyle = "#444444";

let drawing = false;




//
// AUTH GATE
//

const { data: { session } } =
	await supabase.auth.getSession();


if (!session) {

	window.location.replace("./login.html" + window.location.search);

}
else {

	logoutButton.hidden = false;

}


supabase.auth.onAuthStateChange((event, newSession) => {

	if (!newSession) {

		window.location.replace("./login.html");

	}

});


logoutButton.addEventListener(
	"click",
	async () => {

		await supabase.auth.signOut();

		window.location.replace("./login.html");

	}
);




function getPos(event) {

	const rect = canvas.getBoundingClientRect();

	const point =
		event.touches ? event.touches[0] : event;

	return {
		x: (point.clientX - rect.left) * (canvas.width / rect.width),
		y: (point.clientY - rect.top) * (canvas.height / rect.height)
	};

}




function start(event) {

	event.preventDefault();

	drawing = true;

	const pos = getPos(event);

	ctx.beginPath();
	ctx.moveTo(pos.x, pos.y);

}




function move(event) {

	if (!drawing) {
		return;
	}

	event.preventDefault();

	const pos = getPos(event);

	ctx.lineTo(pos.x, pos.y);
	ctx.stroke();

}




function stop() {

	drawing = false;

}




canvas.addEventListener("mousedown", start);
canvas.addEventListener("mousemove", move);
window.addEventListener("mouseup", stop);

canvas.addEventListener("touchstart", start, { passive: false });
canvas.addEventListener("touchmove", move, { passive: false });
canvas.addEventListener("touchend", stop);




document.getElementById("clear-signature")
	.addEventListener("click", () => {

		ctx.clearRect(0, 0, canvas.width, canvas.height);

	});




document.getElementById("download-signature")
	.addEventListener("click", () => {

		const link = document.createElement("a");

		link.download = "verhuurder-handtekening.png";
		link.href = canvas.toDataURL("image/png");

		link.click();

	});
