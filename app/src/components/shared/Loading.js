import React from 'react';
import PropTypes from 'prop-types';

const Loading = ({ error }) => (
  <div className="loading">
    Loading ...
    <span className="loading__error">{error}</span>
  </div>
);

Loading.propTypes = {
  error: PropTypes.string
};

Loading.defaultProps = {
  error: null
};

export default Loading;
