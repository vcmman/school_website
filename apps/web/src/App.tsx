import { useEffect, useMemo, useRef, useState } from "react";
import ROSLIB from "roslib";
import ThreeView, { PathPoint } from "./components/ThreeView";
import { connectRos, createRos, disconnectRos, publishTopic, subscribeTopic, type ConnectionStatus } from "./ros/ros";
import { decodePointCloud2, type PointCloud2 } from "./ros/pointcloud";
import { CONTROL_MACROS, DEFAULT_ROSBRIDGE_URL, ROS_TOPICS } from "./ros/config";

function yawToQuaternion(yaw: number) {
  const half = yaw / 2;
  return {
    x: 0,
    y: 0,
    z: Math.sin(half),
    w: Math.cos(half)
  };
}

export default function App() {
  const rosRef = useRef<ROSLIB.Ros | null>(null);
  const subsRef = useRef<Array<() => void>>([]);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [url, setUrl] = useState(DEFAULT_ROSBRIDGE_URL);
  const [points, setPoints] = useState<Float32Array>(new Float32Array());
  const [path, setPath] = useState<PathPoint[]>([]);
  const [robotPosition, setRobotPosition] = useState<PathPoint | undefined>(undefined);
  const [sportState, setSportState] = useState<Record<string, unknown>>({});
  const [lowState, setLowState] = useState<Record<string, unknown>>({});
  const [wirelessState, setWirelessState] = useState<Record<string, unknown>>({});
  const [cmdVel, setCmdVel] = useState({ linear: 0.2, angular: 0 });
  const [cmdHold, setCmdHold] = useState(false);
  const [sportRequestJson, setSportRequestJson] = useState(
    JSON.stringify(
      {
        note: "Fill api_id and parameters per Unitree Sport API",
        api_id: 0,
        parameter: { data: [] }
      },
      null,
      2
    )
  );
  const [goal, setGoal] = useState({ x: 1, y: 0, z: 0, yaw: 0 });

  const isConnected = status === "connected";

  const ros = useMemo(() => {
    if (!rosRef.current) {
      rosRef.current = createRos();
    }
    return rosRef.current;
  }, []);

  useEffect(() => {
    if (!isConnected) return;

    const subs: Array<() => void> = [];

    subs.push(
      subscribeTopic<PointCloud2>(ros, ROS_TOPICS.pointCloud.name, ROS_TOPICS.pointCloud.type, (msg) => {
        setPoints(decodePointCloud2(msg));
      }).unsubscribe
    );

    subs.push(
      subscribeTopic<any>(ros, ROS_TOPICS.path.name, ROS_TOPICS.path.type, (msg) => {
        const nextPath: PathPoint[] = (msg?.poses ?? []).map((pose: any) => ({
          x: pose.pose.position.x,
          y: pose.pose.position.y,
          z: pose.pose.position.z
        }));
        setPath(nextPath);
      }).unsubscribe
    );

    subs.push(
      subscribeTopic<any>(ros, ROS_TOPICS.sportModeState.name, ROS_TOPICS.sportModeState.type, (msg) => {
        setSportState(msg ?? {});
        if (msg?.position) {
          setRobotPosition({
            x: msg.position.x ?? 0,
            y: msg.position.y ?? 0,
            z: msg.position.z ?? 0
          });
        }
      }).unsubscribe
    );

    subs.push(
      subscribeTopic<any>(ros, ROS_TOPICS.lowState.name, ROS_TOPICS.lowState.type, (msg) => {
        setLowState(msg ?? {});
      }).unsubscribe
    );

    subs.push(
      subscribeTopic<any>(ros, ROS_TOPICS.wirelessController.name, ROS_TOPICS.wirelessController.type, (msg) => {
        setWirelessState(msg ?? {});
      }).unsubscribe
    );

    subsRef.current = subs;
    return () => {
      subs.forEach((unsub) => unsub());
    };
  }, [isConnected, ros]);

  useEffect(() => {
    if (!isConnected || !cmdHold) return;

    const interval = window.setInterval(() => {
      publishTopic(ros, ROS_TOPICS.cmdVel.name, ROS_TOPICS.cmdVel.type, {
        linear: { x: cmdVel.linear, y: 0, z: 0 },
        angular: { x: 0, y: 0, z: cmdVel.angular }
      });
    }, 100);

    return () => window.clearInterval(interval);
  }, [cmdHold, cmdVel, isConnected, ros]);

  const handleConnect = () => {
    connectRos(ros, url, setStatus);
  };

  const handleDisconnect = () => {
    subsRef.current.forEach((unsub) => unsub());
    subsRef.current = [];
    disconnectRos(ros, setStatus);
  };

  const handleSendCmdVel = () => {
    publishTopic(ros, ROS_TOPICS.cmdVel.name, ROS_TOPICS.cmdVel.type, {
      linear: { x: cmdVel.linear, y: 0, z: 0 },
      angular: { x: 0, y: 0, z: cmdVel.angular }
    });
  };

  const handleSendSport = () => {
    try {
      const payload = JSON.parse(sportRequestJson);
      publishTopic(ros, ROS_TOPICS.sportRequest.name, ROS_TOPICS.sportRequest.type, payload);
    } catch (error) {
      alert("Invalid JSON for sport request");
    }
  };

  const handleSendMacro = (macroIndex: number) => {
    const macro = CONTROL_MACROS[macroIndex];
    const topic = ROS_TOPICS[macro.topicKey];
    publishTopic(ros, topic.name, topic.type, macro.message);
  };

  const handleSendGoal = () => {
    publishTopic(ros, ROS_TOPICS.plannerGoal.name, ROS_TOPICS.plannerGoal.type, {
      header: {
        frame_id: "map",
        stamp: { sec: 0, nanosec: 0 }
      },
      pose: {
        position: { x: goal.x, y: goal.y, z: goal.z },
        orientation: yawToQuaternion(goal.yaw)
      }
    });
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="logo" />
          <div>
            <div className="title">Unitree GO2 Ground Control</div>
            <div className="subtitle">Point cloud, path, state, and control</div>
          </div>
        </div>
        <div className={`status status-${status}`}>{status}</div>
      </header>

      <div className="content">
        <aside className="panel">
          <section>
            <h2>Connection</h2>
            <div className="row">
              <input value={url} onChange={(e) => setUrl(e.target.value)} />
              {!isConnected ? (
                <button onClick={handleConnect}>Connect</button>
              ) : (
                <button className="danger" onClick={handleDisconnect}>
                  Disconnect
                </button>
              )}
            </div>
            <p className="hint">ROS bridge required. Default `ws://localhost:9090`.</p>
          </section>

          <section>
            <h2>Robot State</h2>
            <div className="state-grid">
              <div>
                <div className="label">SportModeState</div>
                <pre>{JSON.stringify(sportState, null, 2)}</pre>
              </div>
              <div>
                <div className="label">LowState</div>
                <pre>{JSON.stringify(lowState, null, 2)}</pre>
              </div>
              <div>
                <div className="label">Wireless Controller</div>
                <pre>{JSON.stringify(wirelessState, null, 2)}</pre>
              </div>
            </div>
          </section>

          <section>
            <h2>Controls</h2>
            <div className="control-block">
              <div className="label">cmd_vel</div>
              <label>
                Linear X
                <input
                  type="range"
                  min="-1"
                  max="1"
                  step="0.05"
                  value={cmdVel.linear}
                  onChange={(e) => setCmdVel((prev) => ({ ...prev, linear: Number(e.target.value) }))}
                />
                <span>{cmdVel.linear.toFixed(2)}</span>
              </label>
              <label>
                Angular Z
                <input
                  type="range"
                  min="-1"
                  max="1"
                  step="0.05"
                  value={cmdVel.angular}
                  onChange={(e) => setCmdVel((prev) => ({ ...prev, angular: Number(e.target.value) }))}
                />
                <span>{cmdVel.angular.toFixed(2)}</span>
              </label>
              <div className="row">
                <button onClick={handleSendCmdVel}>Send</button>
                <label className="toggle">
                  <input type="checkbox" checked={cmdHold} onChange={(e) => setCmdHold(e.target.checked)} />
                  Hold at 10 Hz
                </label>
              </div>
            </div>

            <div className="control-block">
              <div className="label">Sport API Request</div>
              <textarea value={sportRequestJson} onChange={(e) => setSportRequestJson(e.target.value)} />
              <div className="row">
                <button onClick={handleSendSport}>Send Request</button>
              </div>
              <div className="macro-row">
                {CONTROL_MACROS.map((macro, idx) => (
                  <button key={macro.name} onClick={() => handleSendMacro(idx)}>
                    {macro.name}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section>
            <h2>Planner</h2>
            <div className="control-block">
              <div className="label">Set Goal</div>
              <div className="grid">
                <label>
                  X
                  <input type="number" value={goal.x} onChange={(e) => setGoal({ ...goal, x: Number(e.target.value) })} />
                </label>
                <label>
                  Y
                  <input type="number" value={goal.y} onChange={(e) => setGoal({ ...goal, y: Number(e.target.value) })} />
                </label>
                <label>
                  Z
                  <input type="number" value={goal.z} onChange={(e) => setGoal({ ...goal, z: Number(e.target.value) })} />
                </label>
                <label>
                  Yaw (rad)
                  <input type="number" value={goal.yaw} onChange={(e) => setGoal({ ...goal, yaw: Number(e.target.value) })} />
                </label>
              </div>
              <button onClick={handleSendGoal}>Publish Goal</button>
              <div className="meta">Path points: {path.length}</div>
            </div>
          </section>
        </aside>

        <main className="viewport">
          <ThreeView points={points} path={path} robotPosition={robotPosition} />
        </main>
      </div>
    </div>
  );
}
