import { useState, useEffect, useCallback } from "react";

export interface KeyboardState {
  forward: boolean; // W or ArrowUp
  backward: boolean; // S or ArrowDown
  left: boolean; // A or ArrowLeft
  right: boolean; // D or ArrowRight
  brake: boolean; // Space
  gear1: boolean;
  gear2: boolean;
  gear3: boolean;
  gear4: boolean;
  gear5: boolean;
  gearReverse: boolean; // R
}

const initialState: KeyboardState = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  brake: false,
  gear1: false,
  gear2: false,
  gear3: false,
  gear4: false,
  gear5: false,
  gearReverse: false,
};

export function useKeyboard(): KeyboardState {
  const [keys, setKeys] = useState<KeyboardState>(initialState);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Prevent default for game keys
    if (
      [
        "KeyW",
        "KeyA",
        "KeyS",
        "KeyD",
        "Space",
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
      ].includes(event.code)
    ) {
      event.preventDefault();
    }

    setKeys((prev) => {
      const newState = { ...prev };

      switch (event.code) {
        case "KeyW":
        case "ArrowUp":
          newState.forward = true;
          break;
        case "KeyS":
        case "ArrowDown":
          newState.backward = true;
          break;
        case "KeyA":
        case "ArrowLeft":
          newState.left = true;
          break;
        case "KeyD":
        case "ArrowRight":
          newState.right = true;
          break;
        case "Space":
          newState.brake = true;
          break;
        case "Digit1":
          newState.gear1 = true;
          break;
        case "Digit2":
          newState.gear2 = true;
          break;
        case "Digit3":
          newState.gear3 = true;
          break;
        case "Digit4":
          newState.gear4 = true;
          break;
        case "Digit5":
          newState.gear5 = true;
          break;
        case "KeyR":
          newState.gearReverse = true;
          break;
      }

      return newState;
    });
  }, []);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    setKeys((prev) => {
      const newState = { ...prev };

      switch (event.code) {
        case "KeyW":
        case "ArrowUp":
          newState.forward = false;
          break;
        case "KeyS":
        case "ArrowDown":
          newState.backward = false;
          break;
        case "KeyA":
        case "ArrowLeft":
          newState.left = false;
          break;
        case "KeyD":
        case "ArrowRight":
          newState.right = false;
          break;
        case "Space":
          newState.brake = false;
          break;
        case "Digit1":
          newState.gear1 = false;
          break;
        case "Digit2":
          newState.gear2 = false;
          break;
        case "Digit3":
          newState.gear3 = false;
          break;
        case "Digit4":
          newState.gear4 = false;
          break;
        case "Digit5":
          newState.gear5 = false;
          break;
        case "KeyR":
          newState.gearReverse = false;
          break;
      }

      return newState;
    });
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  return keys;
}
