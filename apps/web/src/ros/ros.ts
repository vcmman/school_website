import ROSLIB from "roslib";

export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

export type TopicHandle = {
  topic: ROSLIB.Topic;
  unsubscribe: () => void;
};

export function createRos(): ROSLIB.Ros {
  return new ROSLIB.Ros();
}

export function connectRos(ros: ROSLIB.Ros, url: string, onStatus: (s: ConnectionStatus) => void) {
  onStatus("connecting");
  ros.connect(url);
  ros.on("connection", () => onStatus("connected"));
  ros.on("close", () => onStatus("disconnected"));
  ros.on("error", () => onStatus("error"));
}

export function disconnectRos(ros: ROSLIB.Ros, onStatus: (s: ConnectionStatus) => void) {
  ros.close();
  onStatus("disconnected");
}

export function subscribeTopic<T>(ros: ROSLIB.Ros, name: string, type: string, cb: (msg: T) => void): TopicHandle {
  const topic = new ROSLIB.Topic({ ros, name, messageType: type });
  topic.subscribe(cb as (msg: unknown) => void);
  return {
    topic,
    unsubscribe: () => topic.unsubscribe()
  };
}

export function publishTopic(ros: ROSLIB.Ros, name: string, type: string, msg: Record<string, unknown>) {
  const topic = new ROSLIB.Topic({ ros, name, messageType: type });
  topic.publish(new ROSLIB.Message(msg));
}
