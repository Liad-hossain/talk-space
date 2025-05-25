const convertTimestampToLocale = (timestamp) => {
    const date = new Date(timestamp * 1000); // Convert seconds to milliseconds (assuming timestamp in seconds)

    const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    };

    return date.toLocaleString('en-US', options);
}

const convertDateTimeToLocale = (datetime_str) => {
    const date = new Date(datetime_str); // Parse ISO string

    const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    };
    return date.toLocaleString(options)
}

const convertTimestampToShowTime = (timestamp) => {
    // Convert timestamp to Date object (handles both UTC strings and timestamps)
    const inputDate = new Date(timestamp*1000);
    const now = new Date();
    // Get start of input date for comparison
    const inputDateStart = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate());

    // Check if it's today
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (inputDateStart.getTime() === today.getTime()) {
        const options = {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        };
        return inputDate.toLocaleTimeString("en-US", options);
    }

    // Check if it's yesterday
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (inputDateStart.getTime() === yesterday.getTime()) {
        return 'Yesterday';
    }

    // Check if it's within the last week
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(today.getDate() - 7);
    if (inputDateStart >= oneWeekAgo && inputDateStart < today) {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return dayNames[inputDate.getDay()];
    }

    // Otherwise return formatted date
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    };
    return inputDate.toLocaleDateString(options);
}


const convertDatetimeToShowTime = (datetime_str) => {
    const timestamp = Math.floor(new Date(datetime_str).getTime()/1000); //Converting to timestamp in seconds
    return convertTimestampToShowTime(timestamp);
}


export {convertTimestampToLocale, convertDateTimeToLocale, convertTimestampToShowTime, convertDatetimeToShowTime};
