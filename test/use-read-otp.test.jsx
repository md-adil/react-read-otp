import 'babel-regenerator-runtime';
import React, { useState } from "react";
import { act, render, waitFor } from "@testing-library/react";
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
    return <div title="hello">{otp}</div>
}

it("reading otp", async () => {
    const screen = render(<OTPRead />);
    expect(globalSignal.aborted).toBe(false);
    await waitFor(() => screen.getByText("12345"));
    expect(globalSignal.aborted).toBe(true);
});
