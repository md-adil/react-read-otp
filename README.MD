## Do you know? you can auto read OTP in your mobile browser as well.
follow this link to know more.
https://web.dev/web-otp/

You have to call handful of functions to get it done. But no worries, if you are using react you can easily read by using hooks in just single line.

## Installing

    npm i react-read-otp

## Import

    import { useReadOTP } from "react-read-otp";

### 1. Reading otp
```ts
function App() {
    const [otp, setOTP] = useState('');
    useReadOTP(setOTP);
    return (
        <div>
            <h3>OTP Screen</h3>
            <input placeholder="Enter otp" value={otp} onChange={e => setOTP(e.target.value)} />
        </div>
    )
}
```

### 2. Browser has to work to find otp in your sms. If the component get unmounted, by default it stop reading. But sometime we need to stop it manually.
```ts
function App() {
    const [otp, setOTP] = useState('');
    const stop = useReadOTP(setOTP);
    return (
        <div>
            <h3>
                Welcome home
            </h3>
            <input placeholder="Enter otp" value={otp} onChange={e => setOTP(e.target.value)} />
            Auto read otp is enabled, <button onClick={() => stop()}>skip</button>
        </div>
    )
}
```

### 3. Browser should start reading OTP only if then OTP has been sent right? Conditionally reading.
```ts
function App() {
    const [enabled, setEnabled] = useState(false);
    const [otp, setOTP] = useState('');
    useReadOTP(setOTP, {
        enabled
    });

    const handleSendOtp = () => {
        // do your api call
        // enable otp listener
        setEnabled(true);
    }
    return (
        <div>
            <h3>
                Welcome home
            </h3>
            <button onClick={handleSendOtp}>send otp<button>
            <input placeholder="Enter otp" value={otp} onChange={e => setOTP(e.target.value)} />
        </div>
    )
}
```


## Reference

```ts
const reader = useReadOTP(callback, option);
```
* `reader`: `() => void` call this to cancel reading in any point of time.

* `callback`: `(otp: string) => any` a callback will be called by hooks if found otp.

* `option`:

    * `enabled`: `boolean` either reading start or not, defaults to `true`
    * `timeout`: `number` timeout milliseconds
    * `onError`: `(error: Error) => void` accepts a callback and will be called on error.
