import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Loading from '../shared/Loading';
import {
  startGame,
  subscribeQueue,
  unsubscribeQueue,
  joinGame
} from '../../utils/socket';
import './styles/gamequeue.css';

class GameQueue extends Component {
  state = {
    playerCount: 1
  };

  /**
   * Add listeners for queue
   */
  componentDidMount() {
    subscribeQueue(this.updateQueueData);
    joinGame(this.props.roomId);
  }

  /**
   * Remove listeners for queue
   */
  componentWillUnmount() {
    unsubscribeQueue();
  }

  /**
   *
   * @param {Object<any>} data
   */
  updateQueueData = data => {
    /**
     * Possible board update
     *  1. player join
     *  2. player leaves
     *  3. game starts
     */
    console.log(data);

    this.setState({
      playerCount: data.playerCount
    });
  };

  render() {
    const { roomId } = this.props;
    const { playerCount } = this.state;

    return (
      <section className="queue">
        <Loading message={`${playerCount}/4 players joined`} />
        <div className="queue__options">
          <p className="queue__invite">
            {`${window.location.host}/game/${roomId}`}
          </p>

          <button
            type="button"
            className="btn btn-med btn-start"
            onClick={startGame}
          >
            Start Game
          </button>
        </div>
      </section>
    );
  }
}

GameQueue.propTypes = {
  roomId: PropTypes.string.isRequired
};

export default GameQueue;
