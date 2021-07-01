https://web.dev/web-otp/

```ts
function App() {
    const [otp, setOTP] = useState('');
    useReadOTP(setOTP);
    return (
        <div>
            <h3>
                Welcome home
            </h3>
            <input placeholder="Enter otp" value={otp} onChange={e => setOTP(e.target.value)} />
        </div>
    )
}
```
