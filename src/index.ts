import { useEffect, useRef } from "react";

function isSupported() {
    return 'OTPCredential' in window && typeof AbortController !== "undefined";
}
async function readSMS(controller: AbortController) {
    const content: any = await navigator.credentials.get({ signal: controller.signal, otp: { transport: ['sms']}} as any)
    if (!content || !content.code) {
        throw new Error('Unable to read otp');
    }
    return content.code;
}

const defaultTimeout = 60 * 1000;
interface Option {
    enabled?: boolean;
    timeout?: number;
    onError?(err: Error): void;
}
interface State {
    abortController?: AbortController;
    timer?: any;
}
type Callback = (otp: string) => any;
export function useReadOTP(callback: Callback, option: Option = {}) {
    const state = useRef<State>({});
    function abort() {
        state.current.abortController?.abort();
        if (state.current.timer) {
            clearTimeout(state.current.timer);
        }
    }
    useEffect(() => {
        if (!isSupported()) {
            console.log('Not supported, exiting');
            return;
        }
        if (!(option.enabled ?? true)) {
            abort();
            return;
        }
        const controller = state.current.abortController = new AbortController();
        readSMS(controller).then((otp) => {
            abort();
            callback(otp);
        }).catch(err => {
            if (option.onError) {
                option.onError(err);
            }
            abort();
        });
        state.current.timer = setTimeout(abort, option.timeout ?? defaultTimeout);
        return abort;
    }, [option.enabled]);
    return abort;
}