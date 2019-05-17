import React from 'react';
import PropTypes from 'prop-types';

const Loading = ({ message, error }) => (
  <div className="loading">
    Loading ...
    <span className="loading__message">{message}</span>
    <span className="loading__error">{error}</span>
  </div>
);

Loading.propTypes = {
  message: PropTypes.string,
  error: PropTypes.string
};

Loading.defaultProps = {
  message: null,
  error: null
};

export default Loading;
