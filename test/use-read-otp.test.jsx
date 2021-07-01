import 'babel-regenerator-runtime';
import React, { useState } from "react";
import { render, waitFor, fireEvent } from "@testing-library/react";
import { useReadOTP } from "../";
window.OTPCredential = true;
function sleep(n) {
    return new Promise(x => {
        setTimeout(x, n);
    })
}
let globalSignal;
navigator.credentials = { 
    get: async function({ signal, otp: { transport } }) {
        globalSignal = signal;
        if (!transport.includes("sms")) {
            throw new Error('Not a valid transport');
        }
        await sleep(100);
        if (signal.aborted) {
            throw new Error('aborted');
        }
        return { code: '12345' };
    }
};

function OTPRead() {
    const [otp, setOTP] = useState('waiting...');
    useReadOTP(setOTP);
    return <div title="otp">{otp}</div>
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
    expect(screen.getByTitle("otp").innerHTML).toBe("waiting...")
    screen.unmount();
    expect(globalSignal.aborted).toBe(true);
});

it("should activate only if enabled", async () => {
    function Hello() {
        const [otp, setOTP] = useState('waiting');
        const [active, setActive] = useState(false);
        useReadOTP(setOTP, {
            enabled: active
        });
        return <div>
            <button role="btn" onClick={() => setActive(true)}>Click</button>
            <div role="otp">{otp}</div>
        </div>
    }
    const screen = render(<Hello />);
    await sleep(101);
    expect(screen.getByRole('otp').innerHTML).toBe('waiting');
    fireEvent.click(screen.getByRole('btn'));
    waitFor(() => screen.getByText('12345'))
});


it("timeout", async () => {
    function Hello() {
        const [otp, setOTP] = useState('waiting');
        const [err, setError] = useState('');
        useReadOTP(setOTP, {
            timeout: 50,
            onError(e) {
                setError(e.message);
            }
        });
        return <div>
            <div role="otp">{otp}</div>
            <div role="error">{err}</div>
        </div>
    }
    const screen = render(<Hello />);
    await waitFor(() => screen.getByText('aborted'))
    await sleep(100);
    expect(screen.getByRole('otp').innerHTML).toBe('waiting');
});

it("manually cancel", async () => {
    function Hello() {
        const [otp, setOTP] = useState('waiting');
        const [err, setError] = useState('');
        const reader = useReadOTP(setOTP, {
            onError(e) {
                setError(e.message);
            }
        });
        return <div>
            <div role="otp">{otp}</div>
            <div role="error">{err}</div>
            <button role="btn" onClick={() => reader()}>Cancel</button>
        </div>
    }
    const screen = render(<Hello />);
    await sleep(50);
    fireEvent.click(screen.getByRole('btn'));
    await sleep(51);
    expect(screen.getByRole('otp').innerHTML).toBe('waiting');
    await waitFor(() => screen.getByText('aborted'))
});