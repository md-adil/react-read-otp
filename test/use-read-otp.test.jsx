import 'babel-regenerator-runtime';
import React, { useState } from "react";
import { render, waitFor } from "@testing-library/react";
import { useReadOTP } from "../lib";
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
        await sleep(100);
        return Promise.resolve({code: '12345'})
    }
};

function OTPRead() {
    const [otp, setOTP] = useState('waiting...');
    useReadOTP(setOTP, {onError: (e) => console.error('my error:', e.message)});
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
