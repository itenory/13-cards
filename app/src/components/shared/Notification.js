import React from 'react';
import PropTypes from 'prop-types';

const Notification = ({ message, clearError }) => {
  setInterval(clearError, 4000);
  return <div className="">{message}</div>;
};
Notification.propTypes = {
  message: PropTypes.string.isRequired,
  clearError: PropTypes.func.isRequired
};

export default Notification;
