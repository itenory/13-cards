import React from 'react';
import PropTypes from 'prop-types';

const GameQueue = props => (
  <section className="">
    <div className="">
      <p>Link to Join Game: </p>
      <span>
        {window.location.host}
        /game/
        {props.roomId}
      </span>
    </div>
  </section>
);

GameQueue.propTypes = {
  roomId: PropTypes.string.isRequired
};

export default GameQueue;
