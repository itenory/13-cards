import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import { ajaxRequest } from '../../utils/utils';
import Notification from '../shared/Notification';

class HomePage extends Component {
  state = {
    roomId: null,
    matchError: null
  };

  createRoom = () => {
    ajaxRequest('/create/room', 'post')
      .then(res => {
        // If a room id is sent back, redirect to room page
        if (res.data.roomId) {
          this.setState({ roomId: res.data.roomId });
        }
      })
      .catch(err => {
        this.setState({ matchError: err.response.data });
      });
  };

  render() {
    const { roomId, matchError } = this.state;
    if (roomId) return <Redirect to={`/game/${roomId}`} />;

    return (
      <section className="">
        {matchError && (
          <Notification
            message={matchError}
            clearError={() => this.setState({ matchError: null })}
          />
        )}
        <button type="button" onClick={this.createRoom}>
          Create room
        </button>
      </section>
    );
  }
}

export default HomePage;
