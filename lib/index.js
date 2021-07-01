"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useReadOTP = void 0;
const react_1 = require("react");
function isSupported() {
    return 'OTPCredential' in window && typeof AbortController !== "undefined";
}
function readSMS(controller) {
    return __awaiter(this, void 0, void 0, function* () {
        const content = yield navigator.credentials.get({ signal: controller.signal, otp: { transport: ['sms'] } });
        if (!content || !content.code) {
            throw new Error('Unable to read otp');
        }
        return content.code;
    });
}
const defaultTimeout = 60 * 1000;
function useReadOTP(callback, option = {}) {
    const state = react_1.useRef({});
    function abort() {
        var _a;
        (_a = state.current.abortController) === null || _a === void 0 ? void 0 : _a.abort();
        if (state.current.timer) {
            clearTimeout(state.current.timer);
        }
    }
    react_1.useEffect(() => {
        var _a, _b;
        if (!isSupported()) {
            console.log('Not supported, exiting');
            return;
        }
        if (!((_a = option.enabled) !== null && _a !== void 0 ? _a : true)) {
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
        state.current.timer = setTimeout(abort, (_b = option.timeout) !== null && _b !== void 0 ? _b : defaultTimeout);
        return abort;
    }, [option.enabled]);
    return abort;
}
exports.useReadOTP = useReadOTP;
