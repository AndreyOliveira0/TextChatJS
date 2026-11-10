function getTimeString(date) {
	const _date = date ?? new Date(Date.now());
	const hours = _date.getHours().toString().padStart(2, "0");
	const minutes = _date.getMinutes().toString().padStart(2, "0");
	const seconds = _date.getSeconds().toString().padStart(2, "0");
	return `${hours}:${minutes}:${seconds}`;
}
module.exports = { getTimeString };