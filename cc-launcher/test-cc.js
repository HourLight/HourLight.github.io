#!/usr/bin/env node

/**
 * Claude Code 測試啟動器
 * 快速測試 CC 系統是否正常運作
 */

const ClaudeCodeLauncher = require('./cc-main.js');

async function testCC() {
    console.log('🧪 Claude Code 系統測試開始\n');

    try {
        // 初始化 CC 系統
        const cc = new ClaudeCodeLauncher();

        console.log('\n📋 測試基本指令...');

        // 測試 help 指令
        console.log('\n1️⃣ 測試: cc');
        await cc.execute('cc');

        console.log('\n2️⃣ 測試: cc status');
        await cc.execute('cc status');

        console.log('\n3️⃣ 測試: cc s (快捷鍵)');
        await cc.execute('cc s');

        console.log('\n4️⃣ 測試: 未知指令');
        await cc.execute('cc unknown-command');

        console.log('\n✅ Claude Code 系統測試完成！');
        console.log('\n🚀 系統已就緒，可以開始使用 CC 指令');
        console.log('💡 在終端機執行: node cc-launcher/cc-main.js');
        console.log('📱 在專案目錄輸入: cc');

    } catch (error) {
        console.error('\n❌ 測試過程發生錯誤:', error);
        process.exit(1);
    }
}

// 執行測試
if (require.main === module) {
    testCC();
}