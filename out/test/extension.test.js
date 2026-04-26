"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const assert = __importStar(require("assert"));
const vscode = __importStar(require("vscode"));
const agents_1 = require("../agents");
suite('Balkan DevOps Agents Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');
    test('Extension should be present', () => {
        assert.ok(vscode.extensions.getExtension('subzone.balkan-devops-agents'));
    });
    test('Should have 10 agents defined', () => {
        assert.strictEqual(agents_1.AGENTS.length, 10);
    });
    test('All agents should have required properties', () => {
        agents_1.AGENTS.forEach(agent => {
            assert.ok(agent.id, `Agent missing id: ${JSON.stringify(agent)}`);
            assert.ok(agent.name, `Agent missing name: ${agent.id}`);
            assert.ok(agent.fullName, `Agent missing fullName: ${agent.id}`);
            assert.ok(agent.description, `Agent missing description: ${agent.id}`);
            assert.ok(agent.systemPrompt, `Agent missing systemPrompt: ${agent.id}`);
        });
    });
    test('Agent names should match expected values', () => {
        const expectedNames = ['steva', 'toza', 'mile', 'sima', 'uske', 'joca', 'gile', 'laki', 'zika', 'moma'];
        const actualNames = agents_1.AGENTS.map(a => a.name);
        expectedNames.forEach(name => {
            assert.ok(actualNames.includes(name), `Expected agent ${name} not found`);
        });
    });
    test('Agent IDs should have correct prefix', () => {
        agents_1.AGENTS.forEach(agent => {
            assert.ok(agent.id.startsWith('balkan-devops.'), `Agent ID ${agent.id} should start with 'balkan-devops.'`);
        });
    });
    test('System prompts should contain Serbian language', () => {
        agents_1.AGENTS.forEach(agent => {
            // Check for common Serbian characters or words
            const hasSerbianContent = /[čćžšđ]|balkan|devops/i.test(agent.systemPrompt);
            assert.ok(hasSerbianContent, `Agent ${agent.name} system prompt should contain Serbian content`);
        });
    });
    test('Agent full names should be unique', () => {
        const fullNames = agents_1.AGENTS.map(a => a.fullName);
        const uniqueNames = new Set(fullNames);
        assert.strictEqual(fullNames.length, uniqueNames.size, 'All agent full names should be unique');
    });
    test('Agent IDs should be unique', () => {
        const ids = agents_1.AGENTS.map(a => a.id);
        const uniqueIds = new Set(ids);
        assert.strictEqual(ids.length, uniqueIds.size, 'All agent IDs should be unique');
    });
});
//# sourceMappingURL=extension.test.js.map