import { KeyboardState } from "../hooks/useKeyboard";
import { VehicleData } from "../types/sensorData";

export interface VehiclePhysicsState {
  // Position
  x: number;
  z: number;
  rotation: number; // radians

  // Velocity
  velocity: number; // m/s
  steeringAngle: number; // degrees

  // Gear
  gear: string;
  gearNumber: number; // -1=R, 0=N, 1-5
}

export interface PhysicsConfig {
  maxSpeed: number; // km/h
  acceleration: number; // m/s²
  brakeForce: number; // m/s²
  friction: number; // deceleration when no input
  steeringSpeed: number; // degrees per frame
  maxSteeringAngle: number; // degrees
  steeringReturnSpeed: number; // how fast steering returns to center
}

const DEFAULT_CONFIG: PhysicsConfig = {
  maxSpeed: 180,
  acceleration: 8,
  brakeForce: 15,
  friction: 2,
  steeringSpeed: 3,
  maxSteeringAngle: 35,
  steeringReturnSpeed: 5,
};

// Gear ratios affect max speed and acceleration
const GEAR_CONFIG: Record<number, { maxSpeed: number; accelerationMult: number }> = {
  [-1]: { maxSpeed: 30, accelerationMult: 0.5 }, // Reverse
  [0]: { maxSpeed: 0, accelerationMult: 0 }, // Neutral
  [1]: { maxSpeed: 40, accelerationMult: 1.5 },
  [2]: { maxSpeed: 70, accelerationMult: 1.2 },
  [3]: { maxSpeed: 110, accelerationMult: 1.0 },
  [4]: { maxSpeed: 150, accelerationMult: 0.8 },
  [5]: { maxSpeed: 180, accelerationMult: 0.6 },
};

export function createInitialPhysicsState(): VehiclePhysicsState {
  return {
    x: 0,
    z: 0,
    rotation: 0,
    velocity: 0,
    steeringAngle: 0,
    gear: "N",
    gearNumber: 0,
  };
}

export type GearMode = "automatic" | "manual";

export function updateVehiclePhysics(
  state: VehiclePhysicsState,
  keys: KeyboardState,
  deltaTime: number,
  gearMode: GearMode = "automatic",
  config: PhysicsConfig = DEFAULT_CONFIG
): VehiclePhysicsState {
  const newState = { ...state };
  const dt = deltaTime / 1000; // Convert to seconds
  const isNearlyStoppedForward = newState.velocity >= 0 && newState.velocity < 0.5;
  const isNearlyStoppedBackward = newState.velocity <= 0 && newState.velocity > -0.5;
  const isStopped = Math.abs(newState.velocity) < 0.5;

  // Handle gear changes based on mode
  if (gearMode === "manual") {
    // Manual mode: only change gear when specific key is pressed
    if (keys.gear1) {
      newState.gear = "1";
      newState.gearNumber = 1;
    } else if (keys.gear2) {
      newState.gear = "2";
      newState.gearNumber = 2;
    } else if (keys.gear3) {
      newState.gear = "3";
      newState.gearNumber = 3;
    } else if (keys.gear4) {
      newState.gear = "4";
      newState.gearNumber = 4;
    } else if (keys.gear5) {
      newState.gear = "5";
      newState.gearNumber = 5;
    } else if (keys.gearReverse) {
      newState.gear = "R";
      newState.gearNumber = -1;
    }
    // Manual mode: S while stopped shifts to Reverse
    else if (keys.backward && isStopped && newState.gearNumber !== -1) {
      newState.gear = "R";
      newState.gearNumber = -1;
    }
    // Manual mode: W while in Reverse and stopped/nearly stopped shifts to Gear 1
    else if (keys.forward && isNearlyStoppedBackward && newState.gearNumber === -1) {
      newState.velocity = 0;
      newState.gear = "1";
      newState.gearNumber = 1;
    }
  } else {
    // Automatic mode: auto-shift based on speed
    // Manual override for Reverse
    if (keys.gearReverse) {
      newState.gear = "R";
      newState.gearNumber = -1;
    }
    // W while in Reverse and nearly stopped: brake and shift to Gear 1
    else if (keys.forward && newState.gearNumber === -1) {
      if (isNearlyStoppedBackward) {
        newState.velocity = 0;
        newState.gear = "1";
        newState.gearNumber = 1;
      } else {
        // Still moving backward - just brake
        newState.velocity = Math.min(0, newState.velocity + config.brakeForce * dt);
      }
    }
    // S while stopped or nearly stopped going forward: shift to Reverse
    else if (keys.backward && isNearlyStoppedForward && newState.gearNumber >= 0) {
      newState.velocity = 0;
      newState.gear = "R";
      newState.gearNumber = -1;
    }
    // W while in Neutral or stopped: auto-start in Gear 1
    else if (keys.forward && newState.gearNumber <= 0 && newState.velocity >= 0) {
      newState.gear = "1";
      newState.gearNumber = 1;
    }
    // Auto-shift based on current speed (km/h) when in forward gears
    else if (newState.gearNumber > 0) {
      const speedKmh = Math.abs(newState.velocity * 3.6);

      // Shift up thresholds
      if (speedKmh > 35 && newState.gearNumber === 1) {
        newState.gear = "2";
        newState.gearNumber = 2;
      } else if (speedKmh > 60 && newState.gearNumber === 2) {
        newState.gear = "3";
        newState.gearNumber = 3;
      } else if (speedKmh > 95 && newState.gearNumber === 3) {
        newState.gear = "4";
        newState.gearNumber = 4;
      } else if (speedKmh > 130 && newState.gearNumber === 4) {
        newState.gear = "5";
        newState.gearNumber = 5;
      }
      // Shift down thresholds
      else if (speedKmh < 25 && newState.gearNumber === 2) {
        newState.gear = "1";
        newState.gearNumber = 1;
      } else if (speedKmh < 50 && newState.gearNumber === 3) {
        newState.gear = "2";
        newState.gearNumber = 2;
      } else if (speedKmh < 80 && newState.gearNumber === 4) {
        newState.gear = "3";
        newState.gearNumber = 3;
      } else if (speedKmh < 110 && newState.gearNumber === 5) {
        newState.gear = "4";
        newState.gearNumber = 4;
      }
    }
  }

  const gearConfig = GEAR_CONFIG[newState.gearNumber] || GEAR_CONFIG[0];
  const maxSpeedMs = gearConfig.maxSpeed / 3.6; // Convert km/h to m/s

  // Steering
  if (keys.left) {
    newState.steeringAngle = Math.min(
      newState.steeringAngle + config.steeringSpeed,
      config.maxSteeringAngle
    );
  } else if (keys.right) {
    newState.steeringAngle = Math.max(
      newState.steeringAngle - config.steeringSpeed,
      -config.maxSteeringAngle
    );
  } else {
    // Return to center
    if (newState.steeringAngle > 0) {
      newState.steeringAngle = Math.max(0, newState.steeringAngle - config.steeringReturnSpeed);
    } else if (newState.steeringAngle < 0) {
      newState.steeringAngle = Math.min(0, newState.steeringAngle + config.steeringReturnSpeed);
    }
  }

  // Acceleration/Braking
  if (keys.brake) {
    // Handbrake - strong braking (always stops the car)
    if (newState.velocity > 0) {
      newState.velocity = Math.max(0, newState.velocity - config.brakeForce * 1.5 * dt);
    } else if (newState.velocity < 0) {
      newState.velocity = Math.min(0, newState.velocity + config.brakeForce * 1.5 * dt);
    }
  } else if (keys.forward && newState.gearNumber > 0) {
    // W in forward gear: accelerate forward
    const acceleration = config.acceleration * gearConfig.accelerationMult;
    newState.velocity = Math.min(maxSpeedMs, newState.velocity + acceleration * dt);
  } else if (keys.backward && newState.gearNumber === -1) {
    // S in Reverse gear: accelerate backward
    const acceleration = config.acceleration * gearConfig.accelerationMult;
    newState.velocity = Math.max(-maxSpeedMs, newState.velocity - acceleration * dt);
  } else if (keys.backward && newState.velocity > 0.5) {
    // S while moving forward (not nearly stopped): brake
    newState.velocity = Math.max(0, newState.velocity - config.brakeForce * dt);
  } else if (keys.forward && newState.velocity < -0.5 && newState.gearNumber === -1) {
    // W while moving backward in Reverse: brake (handled above in gear logic too)
    newState.velocity = Math.min(0, newState.velocity + config.brakeForce * dt);
  } else {
    // Natural friction/deceleration
    if (newState.velocity > 0) {
      newState.velocity = Math.max(0, newState.velocity - config.friction * dt);
    } else if (newState.velocity < 0) {
      newState.velocity = Math.min(0, newState.velocity + config.friction * dt);
    }
  }

  // Update rotation based on steering (only when moving)
  if (Math.abs(newState.velocity) > 0.1) {
    const turnRadius = 4; // meters (approximate car wheelbase)
    const steeringRad = (newState.steeringAngle * Math.PI) / 180;
    const angularVelocity = (newState.velocity / turnRadius) * Math.tan(steeringRad);
    newState.rotation += angularVelocity * dt;
  }

  // Calculate proposed new position
  const proposedX = newState.x + Math.sin(newState.rotation) * newState.velocity * dt;
  const proposedZ = newState.z + Math.cos(newState.rotation) * newState.velocity * dt;

  // === BOUNDARY COLLISION - Check BEFORE applying position ===
  const roadRadius = 50;
  const roadWidth = 14;
  const innerBoundary = roadRadius - roadWidth / 2 - 0.5; // Inner barrier
  const outerBoundary = roadRadius + roadWidth / 2 + 0.5; // Outer barrier
  const pitLaneHalfWidth = roadWidth / 2 - 0.5;
  const pitLaneStart = -2; // Slightly behind origin
  const pitLaneEnd = roadRadius + 5; // Extends into track area for smooth transition

  const distFromCenter = Math.sqrt(proposedX * proposedX + proposedZ * proposedZ);

  // Check if proposed position is on pit lane
  const isOnPitLane =
    Math.abs(proposedX) <= pitLaneHalfWidth && proposedZ >= pitLaneStart && proposedZ <= pitLaneEnd;

  // Check if proposed position is on circular track
  const isOnTrack = distFromCenter >= innerBoundary && distFromCenter <= outerBoundary;

  // Determine if position is valid
  let validPosition = isOnPitLane || isOnTrack;

  // Special case: transition zone between pit lane and track
  const inTransitionZone =
    proposedZ > roadRadius - 10 &&
    proposedZ < roadRadius + 10 &&
    Math.abs(proposedX) < pitLaneHalfWidth + 5;
  if (inTransitionZone) {
    validPosition = true; // Allow movement in transition zone
  }

  if (validPosition) {
    // Position is valid, apply it
    newState.x = proposedX;
    newState.z = proposedZ;
  } else {
    // Position would be out of bounds - constrain it

    // On the track area (circular), enforce circular boundaries
    if (proposedZ <= pitLaneStart || Math.abs(proposedX) > pitLaneHalfWidth + 2) {
      const angle = Math.atan2(proposedX, proposedZ);

      if (distFromCenter < innerBoundary) {
        // Too close to center - push to inner boundary
        newState.x = Math.sin(angle) * (innerBoundary + 1);
        newState.z = Math.cos(angle) * (innerBoundary + 1);
        newState.velocity = Math.abs(newState.velocity) * 0.2; // Reduce speed significantly
      } else if (distFromCenter > outerBoundary) {
        // Too far from center - push to outer boundary
        newState.x = Math.sin(angle) * (outerBoundary - 1);
        newState.z = Math.cos(angle) * (outerBoundary - 1);
        newState.velocity = Math.abs(newState.velocity) * 0.2;
      } else {
        // Somewhere else invalid - just don't move
        newState.velocity = Math.abs(newState.velocity) * 0.3;
      }
    } else {
      // On pit lane area, enforce side boundaries
      if (proposedX < -pitLaneHalfWidth) {
        newState.x = -pitLaneHalfWidth + 0.5;
        newState.z = proposedZ; // Allow Z movement
        newState.velocity = Math.abs(newState.velocity) * 0.5;
      } else if (proposedX > pitLaneHalfWidth) {
        newState.x = pitLaneHalfWidth - 0.5;
        newState.z = proposedZ;
        newState.velocity = Math.abs(newState.velocity) * 0.5;
      }
    }
  }

  // Final safety check - hard boundaries that can NEVER be crossed
  const finalDist = Math.sqrt(newState.x * newState.x + newState.z * newState.z);
  const absoluteInnerLimit = roadRadius - roadWidth / 2 - 2;
  const absoluteOuterLimit = roadRadius + roadWidth / 2 + 2;

  // Only apply circular limits when clearly on the track (not pit lane)
  const clearlyOnPitLane =
    Math.abs(newState.x) < pitLaneHalfWidth && newState.z > 0 && newState.z < roadRadius - 5;

  if (!clearlyOnPitLane) {
    if (finalDist < absoluteInnerLimit) {
      const angle = Math.atan2(newState.x, newState.z);
      newState.x = Math.sin(angle) * absoluteInnerLimit;
      newState.z = Math.cos(angle) * absoluteInnerLimit;
      newState.velocity = 0;
    } else if (finalDist > absoluteOuterLimit && newState.z < roadRadius - 5) {
      const angle = Math.atan2(newState.x, newState.z);
      newState.x = Math.sin(angle) * absoluteOuterLimit;
      newState.z = Math.cos(angle) * absoluteOuterLimit;
      newState.velocity = 0;
    }
  }

  return newState;
}

export function physicsToVehicleData(
  physics: VehiclePhysicsState,
  keys: KeyboardState
): Partial<VehicleData> {
  const speedKmh = Math.abs(physics.velocity * 3.6); // Convert m/s to km/h

  // Calculate throttle as 0-1 based on actual acceleration
  let throttle = 0;
  if (keys.forward && physics.gearNumber > 0) {
    throttle = 1;
  } else if (keys.backward && physics.gearNumber === -1) {
    throttle = 1;
  }

  return {
    speed: speedKmh,
    steeringAngle: physics.steeringAngle / 35, // Normalize to -1 to 1 range
    throttle: throttle,
    brakePressed: keys.brake || (keys.backward && physics.velocity > 0),
    handbrakeEngaged: keys.brake,
    direction: physics.velocity > 0.1 ? "forward" : physics.velocity < -0.1 ? "reverse" : "stopped",
  };
}

export function calculateRPM(speed: number, gear: number): number {
  if (gear <= 0) return 800; // Idle in neutral/reverse

  const gearRatios: Record<number, number> = {
    1: 150,
    2: 85,
    3: 55,
    4: 40,
    5: 30,
  };

  const ratio = gearRatios[gear] || 50;
  const rpm = 800 + speed * ratio;

  return Math.min(7000, Math.max(800, rpm));
}
