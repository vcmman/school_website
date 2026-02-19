export const DEFAULT_ROSBRIDGE_URL = "ws://localhost:9090";

export const ROS_TOPICS = {
  pointCloud: {
    name: "/utlidar/cloud",
    type: "sensor_msgs/PointCloud2"
  },
  path: {
    name: "/plan",
    type: "nav_msgs/Path"
  },
  sportModeState: {
    name: "/sportmodestate",
    type: "unitree_go/msg/SportModeState"
  },
  lowState: {
    name: "/lowstate",
    type: "unitree_go/msg/LowState"
  },
  wirelessController: {
    name: "/wirelesscontroller",
    type: "unitree_go/msg/WirelessController"
  },
  sportRequest: {
    name: "/api/sport/request",
    type: "unitree_api/msg/Request"
  },
  cmdVel: {
    name: "/cmd_vel",
    type: "geometry_msgs/Twist"
  },
  plannerGoal: {
    name: "/goal_pose",
    type: "geometry_msgs/PoseStamped"
  }
};

export type ControlMacro = {
  name: string;
  topicKey: keyof typeof ROS_TOPICS;
  message: Record<string, unknown>;
};

export const CONTROL_MACROS: ControlMacro[] = [
  {
    name: "Stand (placeholder)",
    topicKey: "sportRequest",
    message: {
      note: "Fill api_id and parameters per Unitree Sport API",
      api_id: 0,
      parameter: { data: [] }
    }
  }
];
