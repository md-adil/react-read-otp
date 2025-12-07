import "babel-regenerator-runtime";
import React, { useState } from "react";
import { render, waitFor, fireEvent } from "@testing-library/react";
import { useReadOTP } from "../";
window.OTPCredential = true;
function sleep(n) {
  return new Promise((x) => {
    setTimeout(x, n);
  });
}
let globalSignal;
navigator.credentials = {
  get: async function ({ signal, otp: { transport } }) {
    globalSignal = signal;
    if (!transport.includes("sms")) {
      throw new Error("Not a valid transport");
    }
    await sleep(100);
    if (signal.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }
    return { code: "12345" };
  },
};

function OTPRead() {
  const [otp, setOTP] = useState("waiting...");
  useReadOTP(setOTP);
  return <div title="otp">{otp}</div>;
}

it("reading otp", async () => {
  const screen = render(<OTPRead />);
  expect(globalSignal.aborted).toBe(false);
  await waitFor(() => screen.getByText("12345"));
  expect(globalSignal.aborted).toBe(true);
});

it("reading otp expecting umount before received", async () => {
  const screen = render(<OTPRead />);
  expect(globalSignal.aborted).toBe(false);
  expect(screen.getByTitle("otp").innerHTML).toBe("waiting...");
  screen.unmount();
  expect(globalSignal.aborted).toBe(true);
});

it("should activate only if enabled", async () => {
  function Hello() {
    const [otp, setOTP] = useState("waiting");
    const [active, setActive] = useState(false);
    useReadOTP(setOTP, {
      enabled: active,
    });
    return (
      <div>
        <button role="btn" onClick={() => setActive(true)}>
          Click
        </button>
        <div role="otp">{otp}</div>
      </div>
    );
  }
  const screen = render(<Hello />);
  await sleep(101);
  expect(screen.getByRole("otp").innerHTML).toBe("waiting");
  fireEvent.click(screen.getByRole("btn"));
  await waitFor(() => screen.getByText("12345"));
});

it("timeout", async () => {
  function Hello() {
    const [otp, setOTP] = useState("waiting");
    useReadOTP(setOTP, {
      timeout: 50,
    });
    return (
      <div>
        <div role="otp">{otp}</div>
      </div>
    );
  }
  const screen = render(<Hello />);
  await sleep(100);
  // Timeout should abort but NOT call onError
  expect(screen.getByRole("otp").innerHTML).toBe("waiting");
  expect(globalSignal.aborted).toBe(true);
});

it("manually cancel", async () => {
  function Hello() {
    const [otp, setOTP] = useState("waiting");
    const reader = useReadOTP(setOTP);
    return (
      <div>
        <div role="otp">{otp}</div>
        <button role="btn" onClick={() => reader()}>
          Cancel
        </button>
      </div>
    );
  }
  const screen = render(<Hello />);
  await sleep(50);
  fireEvent.click(screen.getByRole("btn"));
  await sleep(50);

  // Manual cancel should abort but NOT trigger onError
  expect(screen.getByRole("otp").innerHTML).toBe("waiting");
  expect(globalSignal.aborted).toBe(true);
});

it("race condition: disabling should abort current read", async () => {
  function Hello() {
    const [otp, setOTP] = useState("waiting");
    const [active, setActive] = useState(true);
    useReadOTP(setOTP, {
      enabled: active,
    });
    return (
      <div>
        <button role="toggle" onClick={() => setActive(false)}>
          Disable
        </button>
        <div role="otp">{otp}</div>
      </div>
    );
  }
  const screen = render(<Hello />);
  expect(globalSignal.aborted).toBe(false);

  // Disable reading
  fireEvent.click(screen.getByRole("toggle"));
  await sleep(10);

  // Should have aborted
  expect(globalSignal.aborted).toBe(true);
  expect(screen.getByRole("otp").innerHTML).toBe("waiting");
});

it("changing timeout should restart the effect", async () => {
  function Hello() {
    const [otp, setOTP] = useState("waiting");
    const [currentTimeout, setCurrentTimeout] = useState(200);
    useReadOTP(setOTP, {
      timeout: currentTimeout,
    });
    return (
      <div>
        <div role="otp">{otp}</div>
        <button role="change" onClick={() => setCurrentTimeout(50)}>
          Change Timeout
        </button>
      </div>
    );
  }
  const screen = render(<Hello />);

  // Change timeout before original expires - should restart the effect
  await sleep(25);
  fireEvent.click(screen.getByRole("change"));

  // Wait for new timeout to trigger abort
  await sleep(75);
  expect(screen.getByRole("otp").innerHTML).toBe("waiting");
  expect(globalSignal.aborted).toBe(true);
});

it("multiple re-renders with same callback should not restart", async () => {
  let renderCount = 0;
  function Hello() {
    renderCount++;
    const [otp, setOTP] = useState("waiting");
    const [, forceUpdate] = useState(0);

    // Use a stable callback reference
    const handleOTP = useState(() => (code) => setOTP(code))[0];

    useReadOTP(handleOTP);

    return (
      <div>
        <div role="otp">{otp}</div>
        <div role="renders">{renderCount}</div>
        <button role="rerender" onClick={() => forceUpdate((v) => v + 1)}>
          Rerender
        </button>
      </div>
    );
  }
  const screen = render(<Hello />);

  // Force some re-renders
  fireEvent.click(screen.getByRole("rerender"));
  await sleep(10);

  // Should still receive OTP despite re-renders
  await waitFor(() => screen.getByText("12345"));
  expect(globalSignal.aborted).toBe(true);
});

it("abort errors should NOT trigger onError callback", async () => {
  let errorCalled = false;
  function Hello() {
    const [otp, setOTP] = useState("waiting");
    const cancel = useReadOTP(setOTP, {
      onError() {
        errorCalled = true;
      },
    });
    return (
      <div>
        <div role="otp">{otp}</div>
        <button role="cancel" onClick={cancel}>
          Cancel
        </button>
      </div>
    );
  }
  const screen = render(<Hello />);
  await sleep(50);

  // Manually cancel
  fireEvent.click(screen.getByRole("cancel"));
  await sleep(60);

  // onError should NOT be called for abort errors
  expect(errorCalled).toBe(false);
  expect(screen.getByRole("otp").innerHTML).toBe("waiting");
});

it("non-abort errors SHOULD trigger onError callback", async () => {
  // Override navigator.credentials.get to throw a non-abort error
  const originalGet = navigator.credentials.get;
  navigator.credentials.get = async function () {
    await sleep(50);
    throw new Error("Network error");
  };

  let errorReceived = null;
  function Hello() {
    const [otp, setOTP] = useState("waiting");
    useReadOTP(setOTP, {
      onError(e) {
        errorReceived = e;
      },
    });
    return (
      <div>
        <div role="otp">{otp}</div>
      </div>
    );
  }
  const screen = render(<Hello />);

  // Wait for error
  await sleep(100);

  // onError SHOULD be called for non-abort errors
  expect(errorReceived).not.toBe(null);
  expect(errorReceived.message).toBe("Network error");
  expect(screen.getByRole("otp").innerHTML).toBe("waiting");

  // Restore
  navigator.credentials.get = originalGet;
});

it("timeout SHOULD trigger onError with TimeoutError", async () => {
  let errorReceived = null;
  function Hello() {
    const [otp, setOTP] = useState("waiting");
    useReadOTP(setOTP, {
      timeout: 50,
      onError(err) {
        errorReceived = err;
      },
    });
    return (
      <div>
        <div role="otp">{otp}</div>
      </div>
    );
  }
  const screen = render(<Hello />);

  // Wait for timeout
  await sleep(100);

  // onError SHOULD be called with TimeoutError
  expect(errorReceived).not.toBe(null);
  expect(errorReceived.name).toBe("TimeoutError");
  expect(errorReceived.message).toBe("Request timed out");
  expect(screen.getByRole("otp").innerHTML).toBe("waiting");
});
