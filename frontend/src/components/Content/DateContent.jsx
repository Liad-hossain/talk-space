import React from 'react';

const DateContent = (props) => {
    return (
        <div className='date-content'>
            <span className='date'>{props.date}</span>
        </div>
    );
};

export default DateContent;
