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
    const options = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    };
    return inputDate.toLocaleTimeString("en-US", options);
}


const convertDatetimeToShowTime = (datetime_str) => {
    const timestamp = Math.floor(new Date(datetime_str).getTime()/1000); //Converting to timestamp in seconds
    return convertTimestampToShowTime(timestamp);
}


function convertTimestampToShowDate(timestamp) {
    const date = new Date(timestamp * 1000); // Convert seconds to milliseconds

    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function convertDatetimeToShowDate(datetime_str){
    const timestamp = Math.floor(new Date(datetime_str).getTime()/1000); //Converting to timestamp in seconds
    return convertTimestampToShowDate(timestamp);
}


export {convertTimestampToLocale, convertDateTimeToLocale, convertTimestampToShowTime, convertDatetimeToShowTime, convertTimestampToShowDate, convertDatetimeToShowDate};
