interface Option {
    enabled?: boolean;
    timeout?: number;
    onError?(err: Error): void;
}
declare type Callback = (otp: string) => any;
export declare function useReadOTP(callback: Callback, option?: Option): () => void;
export {};
