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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useReadOTP = void 0;
var react_1 = require("react");
function isSupported() {
    return 'OTPCredential' in window && typeof AbortController !== "undefined";
}
function readSMS(controller) {
    return __awaiter(this, void 0, void 0, function () {
        var content;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, navigator.credentials.get({ signal: controller.signal, otp: { transport: ['sms'] } })];
                case 1:
                    content = _a.sent();
                    if (!content || !content.code) {
                        throw new Error('Unable to read otp');
                    }
                    return [2 /*return*/, content.code];
            }
        });
    });
}
var defaultTimeout = 60 * 1000;
function useReadOTP(callback, option) {
    if (option === void 0) { option = {}; }
    var state = react_1.useRef({});
    function abort() {
        var _a;
        (_a = state.current.abortController) === null || _a === void 0 ? void 0 : _a.abort();
        if (state.current.timer) {
            clearTimeout(state.current.timer);
        }
    }
    react_1.useEffect(function () {
        var _a, _b;
        if (!isSupported()) {
            console.log('Not supported, exiting');
            return;
        }
        if (!((_a = option.enabled) !== null && _a !== void 0 ? _a : true)) {
            abort();
            return;
        }
        var controller = state.current.abortController = new AbortController();
        readSMS(controller).then(function (otp) {
            abort();
            callback(otp);
        }).catch(function (err) {
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
