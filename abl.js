"use strict";

window.addEventListener("DOMContentLoaded", async () => {
	const versionArea = document.getElementById("versionArea");
	const todayArea = document.getElementById("todayArea");
	const birthdayTbody = document.getElementById("birthdayTbody");

	const getDateInYear = (() => {
		const monthDate = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
		const monthDateSum = [...monthDate];
		for (let i = 1; i < monthDateSum.length; i++) {
			monthDateSum[i] += monthDateSum[i - 1];
		}
		return (year, month = 12, date = 31) => {
			if (
				isNaN(year) || isNaN(month) || isNaN(date) ||
				Math.floor(year) !== year || Math.floor(month) !== month || Math.floor(date) !== date ||
				month < 1 || 12 < month ||
				date < 1 || monthDate[month - 1] < date
			) {
				return NaN;
			}
			return (
				(month > 1 ? monthDateSum[month - 2] : 0) +
				date -
				(month > 2 && (year % 4 !== 0 || (year % 100 === 0 && year % 400 !== 0)) ? 1 : 0)
			);
		};
	})();

	// ツェラーの公式で曜日を求める
	const getDayName = (() => {
		const zDayName = ["土", "日", "月", "火", "水", "木", "金"];
		return (year, month, date) => {
			const zYear = year - (month <= 2 ? 1 : 0);
			const zMonth = month + (month <= 2 ? 12 : 0);
			const zDate = date;
			const zC = Math.floor(zYear / 100);
			const zY = (zYear % 100 + 100) % 100;
			const zGamma = -2 * zC + Math.floor(zC / 4);
			const zh = ((zDate + Math.floor(26 * (zMonth + 1) / 10) + zY + Math.floor(zY / 4) + zGamma) % 7 + 7) % 7;
			return zDayName[zh];
		};
	})();

	const data = await (async () => {
		try {
			const dataFetch = await fetch("data.json");
			if (!dataFetch.ok) {
				throw new Error(`unexpected status: ${dataFetch.status}s`);
			}
			return await dataFetch.json();
		} catch (e) {
			console.error(e);
			return null;
		}
	})();

	if (
		typeof data !== "object" ||
		data === null ||
		typeof data.version !== "string" ||
		!Array.isArray(data.idols)
	) {
		versionArea.textContent = "読込エラー";
		return;
	}
	versionArea.textContent = data.version;

	const allowDaysPast = 2;

	const currentTime = new Date();
	const currentYear = currentTime.getFullYear();
	const currentMonth = currentTime.getMonth() + 1;
	const currentDate = currentTime.getDate();
	const lastYearDate = getDateInYear(currentYear - 1);
	const currentYearDate = getDateInYear(currentYear);
	const currentDateSerial = lastYearDate + getDateInYear(currentYear, currentMonth, currentDate);
	todayArea.textContent = `${currentYear}年${currentMonth}月${currentDate}日 (${getDayName(currentYear, currentMonth, currentDate)})`;

	const annotatedIdols = [];
	data.idols.forEach((idol) => {
		if (
			typeof idol === "object" &&
			idol !== null &&
			typeof idol.name === "string" &&
			typeof idol.month === "number" &&
			typeof idol.date === "number"
		) {
			const idolAnnotated = {...idol};
			const lastYearDateSerial = getDateInYear(currentYear - 1, idol.month, idol.date);
			if (isNaN(lastYearDateSerial)) return;
			const currentYearDateSerial = lastYearDate + getDateInYear(currentYear, idol.month, idol.date);
			const nextYearDateSerial = lastYearDate + currentYearDate + getDateInYear(currentYear + 1, idol.month, idol.date);
			if (lastYearDateSerial - currentDateSerial >= -allowDaysPast) {
				idolAnnotated.year = currentYear - 1;
				idolAnnotated.daysLeft = lastYearDateSerial - currentDateSerial;
			} else if (currentYearDateSerial - currentDateSerial >= -allowDaysPast) {
				idolAnnotated.year = currentYear;
				idolAnnotated.daysLeft = currentYearDateSerial - currentDateSerial;
			} else {
				idolAnnotated.year = currentYear + 1;
				idolAnnotated.daysLeft = nextYearDateSerial - currentDateSerial;
			}
			idolAnnotated.dayName = getDayName(idolAnnotated.year, idolAnnotated.month, idolAnnotated.date);
			annotatedIdols.push(idolAnnotated);
		}
	});
	annotatedIdols.sort((a, b) => a.daysLeft - b.daysLeft);

	annotatedIdols.forEach((idol) => {
		const tr = document.createElement("tr");
		birthdayTbody.appendChild(tr);
		const tdIdol = document.createElement("td");
		tdIdol.classList.add("idolName");
		tr.appendChild(tdIdol);
		tdIdol.appendChild(document.createTextNode(idol.name));
		const tdBirthdayYear = document.createElement("td");
		tdBirthdayYear.classList.add("year");
		tr.appendChild(tdBirthdayYear);
		tdBirthdayYear.appendChild(document.createTextNode(`${idol.year}年`));
		const tdBirthdayMonth = document.createElement("td");
		tdBirthdayMonth.classList.add("month");
		tr.appendChild(tdBirthdayMonth);
		tdBirthdayMonth.appendChild(document.createTextNode(`${idol.month}月`));
		const tdBirthdayDate = document.createElement("td");
		tdBirthdayDate.classList.add("date");
		tr.appendChild(tdBirthdayDate);
		tdBirthdayDate.appendChild(document.createTextNode(`${idol.date}日`));
		const tdBirthdayDayName = document.createElement("td");
		tdBirthdayDayName.classList.add("dayName");
		tr.appendChild(tdBirthdayDayName);
		tdBirthdayDayName.appendChild(document.createTextNode(`(${idol.dayName})`));
		const tdLeft = document.createElement("td");
		tdLeft.classList.add("left");
		tr.appendChild(tdLeft);
		tdLeft.appendChild(document.createTextNode(`${idol.daysLeft}日`));
	});
});
