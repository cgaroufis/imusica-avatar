import EventEmitter from 'events';

class Kinect extends EventEmitter {
  constructor() {
    super();
    this.connected = false;
    this.socket = null;
    this.timer = null;
    this.address = '127.0.0.1';
    this.sensor = {
      available: true,
      trackedBodies: 0
    };

    this.on('newListener', this._handleNewListener);
    this.on('removeListener', this._handleRemoveListener);
  }

  connect(address, secure) {
    if (address !== undefined) {
      this.address = address;
    }
    if (secure === undefined) {
      secure = true;
    }
    if (this.socket !== null) {
      this.socket.close();
    }

    this.socket = new WebSocket(`${secure ? 'wss' : 'ws'}://${this.address}:8181`);
    this.socket.binaryType = 'arraybuffer';

    this.lastAdded = null;
    this.lastRemoved = null;

    this.socket.onopen = () => {
      clearTimeout(this.timer);
      this.timer = null;

      this.connected = true;
      this._updateSessionOptions();
      this._updateState();
    };

    this.socket.onclose = () => {
      if (this.socket.readyState === WebSocket.OPEN) {
        // Previous connection closed.
        return;
      }

      this.close();

      this.timer = setTimeout(() => {
        this.connect();
      }, 1000);

    };

    this.socket.onmessage = msg => {
      if (typeof msg.data === 'string') {
        const event = JSON.parse(msg.data);

        switch (event.type) {
          case 'state':
            this._handleStateEvent(event);
            break;
          case 'bodies':
            this._handleBodiesEvent(event);
            break;
          case 'gesture':
            this._handleGestureEvent(event);
            break;
          default:
            break;
        }
      }
      else if (msg.data instanceof ArrayBuffer) {
        this._handleStreamEvent(msg.data);
      }
    };
  }

  close() {
    this.connected = false;
    this.sensor.available = false;
    this.sensor.trackedBodies = 0;
    this._updateState();

    if (this.socket !== null) {
      this.socket.onmessage = null;
      this.socket.onclose = null;
      this.socket.close();
      this.socket = null;
    }
  }

  /* Private methods */
  _handleNewListener = event => {
    this.lastAdded = event;
    this._updateSessionOptions();
  }

  _handleRemoveListener = event => {
    this.lastRemoved = event;
    this._updateSessionOptions();
  }

  _sendServerEvent(eventType, data) {
    const event = { Type: eventType, Data: JSON.stringify(data) };
    this.socket.send(JSON.stringify(event));
  }

  _updateState() {
    const state = {
      connected: this.connected,
      available: this.sensor.available,
      trackedBodies: this.sensor.trackedBodies
    };
    this.emit('state', state);
  }

  _listenersCount(event) {
    let count = this.listenerCount(event);
    if (this.lastAdded !== null && event === this.lastAdded) {
      count++;
      this.lastAdded = null;
    }
    if (this.lastRemoved !== null && event === this.lastAdded) {
      count--;
      this.lastRemoved = null;
    }
    return count;
  }

  _updateSessionOptions() {
    const config = {
      GestureEvents: this._listenersCount('gesture') > 0,
      BodyEvents: this._listenersCount('bodies') > 0,
      DepthEvents: this._listenersCount('depth') > 0
    };

    if (this.connected) {
      this._sendServerEvent('SessionConfig', config);
    }
  }

  /* Server event handlers */
  _handleStateEvent(event) {
    this.sensor.available = event.state.available;
    this.sensor.trackedBodies = event.state.trackedBodies;
    this._updateState();
  }

  _handleBodiesEvent(event) {
    const bodies = [];
    for (let i = 0; i < event.bodies.length; i++) {
      bodies.push(new Body(event.bodies[i]));
    }
    this.emit('bodies', bodies, event.floorClipPlane);
  }

  _handleGestureEvent(event) {
    const { gesture, body } = event;
    this.emit('gesture', gesture, body);
  }

  _handleStreamEvent(data) {
    const desc = new Uint16Array(data, 0, 10);

    if (desc[0] === Kinect.StreamType.Depth) {
      const frameDesc = {width: desc[1], height: desc[2], minDistance: desc[3], maxDistance: desc[4]};
      this.emit('depth', new Uint16Array(data, 10), frameDesc);
    }
  }
}

Kinect.StreamType = Object.freeze({
  'IR': 0,
  'Depth': 1,
  'Color': 2
});

Kinect.JointType = Object.freeze({
  0: 'SpineBase',
  1: 'SpineMid',
  2: 'Neck',
  3: 'Head',
  4: 'ShoulderLeft',
  5: 'ElbowLeft',
  6: 'WristLeft',
  7: 'HandLeft',
  8: 'ShoulderRight',
  9: 'ElbowRight',
  10: 'WristRight',
  11: 'HandRight',
  12: 'HipLeft',
  13: 'KneeLeft',
  14: 'AnkleLeft',
  15: 'FootLeft',
  16: 'HipRight',
  17: 'KneeRight',
  18: 'AnkleRight',
  19: 'FootRight',
  20: 'SpineShoulder',
  21: 'HandTipLeft',
  22: 'ThumbLeft',
  23: 'HandTipRight',
  24: 'ThumbRight'
});

Kinect.HandState = Object.freeze({
  0: 'Unknown',
  1: 'NotTracked',
  2: 'Open',
  3: 'Closed',
  4: 'Lasso'
});

Kinect.TrackingConfidence = Object.freeze({
  0: 'Hight',
  1: 'Low'
});

Kinect.TrackingState = Object.freeze({
  0: 'NotTracked',
  1: 'Inferred',
  2: 'Tracked'
});

class Body {
  constructor(compactBody) {
    this.trackingId = compactBody.TI;
    this.isClosest = compactBody.IC;
    this.handLeftConfidence = Kinect.TrackingConfidence[compactBody.HLC];
    this.handLeftState = Kinect.HandState[compactBody.HLS];
    this.handRightConfidence = Kinect.TrackingConfidence[compactBody.HRC];
    this.handRightState = Kinect.HandState[compactBody.HRS];
    this.leanTrackingState = Kinect.TrackingState[compactBody.LTS];
    this.lean = compactBody.LN;
    this.skeleton = {};

    for (let i = 0; i < compactBody.JN.length; i++) {
      this.skeleton[Kinect.JointType[i]] = new Joint(compactBody.JN[i]);
    }
  }
}

class Joint {
  constructor(compactJoint) {
    this.pos = compactJoint.P;
    this.orient = compactJoint.O;
    this.state = Kinect.TrackingState[compactJoint.S];
  }
}

export default new Kinect();