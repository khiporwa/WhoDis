import React from 'react';
import { MuteIcon } from './MuteIcon';

const VideoContainer = ({ onToggleMute }) => {
  return (
    <div className="video-container">
      {/* Other components */}
      <MuteIcon onClick={onToggleMute} />
    </div>
  );
};

export default VideoContainer;
