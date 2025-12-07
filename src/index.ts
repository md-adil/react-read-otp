import { useEffect, useRef } from "react";

function isSupported() {
  return "OTPCredential" in window && typeof AbortController !== "undefined";
}

async function readSMS(signal: AbortSignal) {
  const content: any = await navigator.credentials.get({
    signal,
    otp: { transport: ["sms"] },
  } as any);
  if (!content || !content.code) {
    throw new DOMException("Unable to read otp", "ReadError");
  }
  return content.code;
}

const defaultTimeout = 60 * 1000;

interface Option {
  enabled?: boolean;
  timeout?: number;
  onError?(err: Error): void;
}

type Callback = (otp: string) => any;

function useLatestRef<T>(val: T) {
  const ref = useRef<T>(val);
  ref.current = val;
  return ref;
}

export function useReadOTP(callback: Callback, option: Option = {}) {
  const { enabled = true, timeout = defaultTimeout, onError } = option;
  const controller = useRef<AbortController | null>(null);
  const timer = useRef<NodeJS.Timeout | null>(null);
  const cb = useLatestRef(callback);
  const errCb = useLatestRef(onError);

  function abort() {
    controller.current?.abort();
    controller.current = null;

    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }

  useEffect(() => {
    if (!enabled || !isSupported()) return;

    controller.current = new AbortController();
    timer.current = setTimeout(() => {
      abort();
      errCb.current?.(new DOMException("Request timed out", "TimeoutError"));
    }, timeout);

    function handleError(err: any) {
      if (errCb.current && err.name !== "AbortError") {
        errCb.current(err);
      }
    }

    readSMS(controller.current.signal)
      .then((otp) => {
        abort();
        cb.current(otp);
      })
      .catch(handleError);

    return abort;
  }, [enabled, timeout]);

  return abort;
}
