import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import { ajaxRequest } from '../../utils/utils';
import GameQueue from './GameQueue';
import GameBoard from './GameBoard';
import Loading from '../shared/Loading';
import {
  startGame,
  subscribeQueue,
  unsubscribeQueue,
  joinGame,
  getUserId
} from '../../utils/socket';

class GamePage extends Component {
  state = {
    roomId: this.props.match.params.roomId,
    matchStart: false,
    matchError: null,
    matchLoading: true,
    playerCount: 0
  };

  /**
   * On component mount, grab room data.
   */
  componentDidMount() {
    const { roomId } = this.state;

    if (roomId) {
      ajaxRequest(`/game/${roomId}/data`, 'get')
        .then(res => {
          if (!res.data.started) {
            return this.setState({
              matchStart: false,
              matchLoading: false
            });
          }

          if (res.data.players && res.data.players.indexOf(getUserId()) >= 0) {
            return this.setState({
              matchStart: true,
              matchLoading: false
            });
          }

          this.setState({
            matchError: 'Not correct user',
            matchLoading: false
          });
        })
        .catch(err => {
          console.log(err);
          this.setState({
            matchError: err.response.data,
            matchLoading: false
          });
        });
    }
  }

  /**
   * Updates game page state
   * @param {Object} state
   */
  updateGameState = state => {
    this.setState({ ...state });
  };

  render() {
    const {
      roomId,
      matchStart,
      matchError,
      matchLoading,
      playerCount
    } = this.state;

    if (matchLoading) return <Loading message="Grabbing game data" />;

    if (!roomId || matchError) return <Redirect to="/" />;

    if (!matchStart)
      return (
        <GameQueue
          roomId={roomId}
          playerCount={playerCount}
          updateGameState={this.updateGameState}
          joinGame={joinGame}
          startGame={startGame}
          subscribeQueue={subscribeQueue}
          unsubscribeQueue={unsubscribeQueue}
        />
      );

    return <GameBoard roomId={roomId} />;
  }
}

export default GamePage;
