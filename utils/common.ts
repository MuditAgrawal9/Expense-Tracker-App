// Returns an array of the last 7 days (including today), each with the day name, date, and placeholders for income/expense.
export const getLast7Days = () => {
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const result = [];

  // Loop over the last 7 days, from 6 days ago to today
  for (let i = 6; i >= 0; i--) {
    const date = new Date(); // Today's date
    date.setDate(date.getDate() - i); // Move back i days

    result.push({
      day: daysOfWeek[date.getDay()],
      date: date.toISOString().split("T")[0],
      income: 0,
      expense: 0,
    });
  }
  return result; // Optional: reverse to have today last
  // returns an array of all the previous 7 days
};

export const getLast12Months = () => {
  const monthsOfYear = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const result = [];

  const today = new Date();
  // Loop over the last 12 months, from 11 months ago to current month
  for (let i = 11; i >= 0; i--) {
    // const date = new Date(); // Current date

    // Always set to the first day of the month to prevent rollover
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    // date.setMonth(date.getMonth() - i); // Move back i months 

    const monthName = monthsOfYear[date.getMonth()]; // Month name (e.g., "Jan")
    const shortYear = date.getFullYear().toString().slice(-2); // Last two digits of year
    const formattedMonthYear = `${monthName} ${shortYear}`; // e.g., "Jan 25"
    const formattedDate = date.toISOString().split("T")[0]; // "YYYY-MM-DD"

    result.push({
      month: formattedMonthYear,
      fullDate: formattedDate,
      income: 0,
      expense: 0,
    });
  }

  // return result;
  return result;
};

export const getYearsRange = (startYear: number, endYear: number): any => {
  const result = [];

  // Loop from startYear to endYear (inclusive)
  for (let year = startYear; year <= endYear; year++) {
    result.push({
      year: year.toString(), // Year as string (e.g., "2025")
      fullDate: `01-01-${year}`, // Date as "01-01-YYYY"
      income: 0,
      expense: 0,
    });
  }
  // return result;
  return result;
};
