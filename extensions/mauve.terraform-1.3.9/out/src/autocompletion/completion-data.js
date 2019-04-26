"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
function loadJsonAs(jsonPath) {
    return new Promise((resolve, reject) => {
        fs.readFile(jsonPath, (err, data) => {
            if (err) {
                reject(new Error(`Could not load data from ${jsonPath}: ${err}`));
            }
            else {
                const json = JSON.parse(data.toString());
                resolve(json);
            }
        });
    });
}
exports.defaultBasePath = (() => {
    try {
        require('vscode');
        // running integration tests
        return path.join(__dirname, '../data/');
    }
    catch (e) {
        // running unit tests
        return path.join(__dirname, '../../out/src/data');
    }
})();
class CompletionIndex {
    constructor(data) {
        this.data = data;
        this.knownProviders = Object.keys(this.data.providers);
    }
    static create(indexPath) {
        return __awaiter(this, void 0, void 0, function* () {
            return new CompletionIndex(yield loadJsonAs(indexPath));
        });
    }
    get providers() {
        return this.knownProviders;
    }
    provider(name) {
        return this.data.providers[name];
    }
    all(type, prefix) {
        const all = type === "resource" ? this.data.views.all.resources : this.data.views.all.datas;
        if (!prefix)
            return all;
        return all.filter((i) => i.startsWith(prefix));
    }
    realVersion(provider, version = "LATEST") {
        if (version !== "LATEST")
            return version;
        const p = this.provider(provider);
        if (!p) {
            throw new Error(`Unknown provider ${provider}`);
        }
        return p.latest;
    }
}
exports.CompletionIndex = CompletionIndex;
class CompletionData {
    constructor(_basePath, _index) {
        this._basePath = _basePath;
        this._index = _index;
        this._loadedData = new Map();
    }
    static create(basePath) {
        return __awaiter(this, void 0, void 0, function* () {
            const indexPath = path.join(basePath, "provider-index.json");
            return new CompletionData(basePath, yield CompletionIndex.create(indexPath));
        });
    }
    get index() {
        return this._index;
    }
    get loadedProviders() {
        return [...this._loadedData.keys()];
    }
    load(provider, version = "LATEST") {
        return __awaiter(this, void 0, void 0, function* () {
            const realVersion = this.index.realVersion(provider, version);
            const providerIndexData = this.index.provider(provider);
            if (!providerIndexData) {
                throw new Error(`Unknown provider ${provider}`);
            }
            const providerVersionInfoData = providerIndexData.versions[realVersion];
            if (!providerVersionInfoData) {
                throw new Error(`Unknown provider version ${realVersion} (requested: ${version}) of provider ${provider}`);
            }
            let providerData = this._loadedData.get(provider);
            if (!providerData) {
                providerData = new Map();
                this._loadedData.set(provider, providerData);
            }
            let providerInfo = providerData.get(realVersion);
            if (!providerInfo) {
                const dataPath = path.join(this._basePath, "providers", providerVersionInfoData.path);
                providerInfo = yield loadJsonAs(dataPath);
                providerData.set(realVersion, providerInfo);
            }
            return providerInfo;
        });
    }
}
exports.CompletionData = CompletionData;

//# sourceMappingURL=completion-data.js.map
