/**
 * Claude Code 主啟動器 v1.0
 * 馥靈之鑰 - CC指令系統核心
 *
 * 快速指令：
 * - cc         顯示所有指令
 * - cc social  社群管理
 * - cc content 內容生成
 * - cc admin   後台管理
 * - cc sync    跨裝置同步
 */

const path = require('path');
const fs = require('fs');
const os = require('os');

class ClaudeCodeLauncher {
    constructor() {
        this.projectRoot = process.cwd();
        this.configDir = path.join(this.projectRoot, '.cc-config');
        this.commandsDir = path.join(__dirname, 'commands');
        this.deviceId = this.detectDevice();
        this.commands = new Map();

        this.init();
    }

    /**
     * 初始化CC系統
     */
    async init() {
        console.log('🚀 Claude Code 啟動中...');
        console.log(`📱 設備: ${this.deviceId}`);
        console.log(`📁 專案: ${path.basename(this.projectRoot)}`);

        // 建立配置目錄
        this.ensureConfigDir();

        // 載入設備配置
        await this.loadDeviceConfig();

        // 註冊核心指令
        this.registerCoreCommands();

        // 載入擴展指令
        await this.loadExtendedCommands();

        console.log('✅ Claude Code 就緒！');
        console.log('💡 輸入 "cc" 查看所有可用指令');
    }

    /**
     * 設備識別
     */
    detectDevice() {
        const hostname = os.hostname();
        const platform = os.platform();
        const username = os.userInfo().username;

        // 根據主機名稱識別設備
        const deviceMap = {
            // 可以根據實際設備名稱配置
            'DESKTOP-TAOYUAN': 'taoyuan-desktop',
            'DESKTOP-KAOHSIUNG': 'kaohsiung-desktop',
            'LAPTOP-A': 'laptop-a',
            'LAPTOP-B': 'laptop-b'
        };

        return deviceMap[hostname] || `${platform}-${username}`;
    }

    /**
     * 確保配置目錄存在
     */
    ensureConfigDir() {
        if (!fs.existsSync(this.configDir)) {
            fs.mkdirSync(this.configDir, { recursive: true });
            fs.mkdirSync(path.join(this.configDir, 'devices'), { recursive: true });
            fs.mkdirSync(path.join(this.configDir, 'profiles'), { recursive: true });
            fs.mkdirSync(path.join(this.configDir, 'shared'), { recursive: true });
        }
    }

    /**
     * 載入設備配置
     */
    async loadDeviceConfig() {
        const deviceConfigPath = path.join(this.configDir, 'devices', `${this.deviceId}.json`);

        if (fs.existsSync(deviceConfigPath)) {
            try {
                const config = JSON.parse(fs.readFileSync(deviceConfigPath, 'utf8'));
                this.deviceConfig = config;
                console.log(`📋 已載入設備配置: ${this.deviceId}`);
            } catch (error) {
                console.warn('⚠️ 設備配置載入失敗，使用預設配置');
                this.deviceConfig = this.getDefaultDeviceConfig();
            }
        } else {
            // 建立預設配置
            this.deviceConfig = this.getDefaultDeviceConfig();
            this.saveDeviceConfig();
            console.log('📝 已建立預設設備配置');
        }
    }

    /**
     * 取得預設設備配置
     */
    getDefaultDeviceConfig() {
        return {
            deviceId: this.deviceId,
            name: this.deviceId,
            type: this.deviceId.includes('desktop') ? 'desktop' : 'laptop',
            profile: 'work-profile',
            shortcuts: {
                'cc s': 'cc social',
                'cc c': 'cc content',
                'cc a': 'cc admin'
            },
            lastSync: new Date().toISOString(),
            createdAt: new Date().toISOString()
        };
    }

    /**
     * 儲存設備配置
     */
    saveDeviceConfig() {
        const deviceConfigPath = path.join(this.configDir, 'devices', `${this.deviceId}.json`);
        fs.writeFileSync(deviceConfigPath, JSON.stringify(this.deviceConfig, null, 2));
    }

    /**
     * 註冊核心指令
     */
    registerCoreCommands() {
        // cc - 顯示說明
        this.commands.set('cc', {
            description: '顯示所有可用的 CC 指令',
            aliases: ['help', 'h'],
            category: 'core',
            execute: () => this.showHelp()
        });

        // cc social - 社群管理
        this.commands.set('cc social', {
            description: '開啟社群管理工具',
            aliases: ['cc s'],
            category: 'social',
            execute: () => this.launchSocial()
        });

        // cc content - 內容生成
        this.commands.set('cc content', {
            description: '開啟內容生成工具',
            aliases: ['cc c'],
            category: 'content',
            execute: () => this.launchContent()
        });

        // cc admin - 後台管理
        this.commands.set('cc admin', {
            description: '開啟後台管理面板',
            aliases: ['cc a'],
            category: 'admin',
            execute: () => this.launchAdmin()
        });

        // cc sync - 同步
        this.commands.set('cc sync', {
            description: '執行跨裝置同步',
            aliases: [],
            category: 'sync',
            execute: () => this.executeSync()
        });

        // cc status - 狀態
        this.commands.set('cc status', {
            description: '顯示系統狀態',
            aliases: [],
            category: 'core',
            execute: () => this.showStatus()
        });

        console.log(`📚 已註冊 ${this.commands.size} 個核心指令`);
    }

    /**
     * 載入擴展指令
     */
    async loadExtendedCommands() {
        // TODO: 從 commands/ 目錄載入額外指令
        // 這裡可以動態載入更多指令模組
    }

    /**
     * 執行指令
     */
    async execute(input) {
        const command = input.trim();

        // 處理快捷鍵
        const actualCommand = this.resolveShortcut(command);

        // 檢查指令是否存在
        if (this.commands.has(actualCommand)) {
            const cmd = this.commands.get(actualCommand);
            console.log(`🏃‍♂️ 執行: ${actualCommand}`);
            try {
                return await cmd.execute();
            } catch (error) {
                console.error(`❌ 指令執行失敗: ${error.message}`);
                return false;
            }
        }

        // 檢查是否有別名匹配
        for (const [cmdName, cmdInfo] of this.commands) {
            if (cmdInfo.aliases.includes(command)) {
                console.log(`🏃‍♂️ 執行: ${cmdName} (別名: ${command})`);
                try {
                    return await cmdInfo.execute();
                } catch (error) {
                    console.error(`❌ 指令執行失敗: ${error.message}`);
                    return false;
                }
            }
        }

        console.log(`❓ 未知指令: ${command}`);
        console.log('💡 輸入 "cc" 查看所有可用指令');
        return false;
    }

    /**
     * 解析快捷鍵
     */
    resolveShortcut(command) {
        return this.deviceConfig.shortcuts[command] || command;
    }

    /**
     * 顯示說明
     */
    showHelp() {
        console.log('\n🎯 Claude Code 指令大全\n');

        const categories = {};
        for (const [cmd, info] of this.commands) {
            if (!categories[info.category]) {
                categories[info.category] = [];
            }
            categories[info.category].push({ cmd, info });
        }

        for (const [category, commands] of Object.entries(categories)) {
            console.log(`📂 ${category.toUpperCase()}`);
            commands.forEach(({ cmd, info }) => {
                const aliases = info.aliases.length > 0 ? ` (${info.aliases.join(', ')})` : '';
                console.log(`  ${cmd}${aliases} - ${info.description}`);
            });
            console.log('');
        }

        console.log('🚀 馥靈之鑰 Claude Code 系統 v1.0');
        console.log('💡 快捷鍵已設定於設備配置檔');
    }

    /**
     * 啟動社群管理
     */
    launchSocial() {
        console.log('📱 啟動社群管理工具...');

        // TODO: 整合現有的社群引擎
        // 可能的實作：
        // 1. 開啟社群管理 Web 介面
        // 2. 執行 Python 社群引擎
        // 3. 顯示社群狀態儀表板

        console.log('🔧 社群管理功能開發中...');
        console.log('📂 將整合現有的 tools/social-engine/');
    }

    /**
     * 啟動內容生成
     */
    launchContent() {
        console.log('✍️ 啟動內容生成工具...');

        // TODO: 整合現有的內容生成工具
        console.log('🔧 內容生成功能開發中...');
    }

    /**
     * 啟動管理後台
     */
    launchAdmin() {
        console.log('⚙️ 啟動管理後台...');

        // TODO: 開啟 admin-dashboard.html 並注入 CC 功能
        const { spawn } = require('child_process');
        const adminPath = path.join(this.projectRoot, 'admin-dashboard.html');

        if (fs.existsSync(adminPath)) {
            console.log('🌐 正在開啟管理後台...');
            // 在預設瀏覽器中開啟
            const command = process.platform === 'win32' ? 'start' :
                           process.platform === 'darwin' ? 'open' : 'xdg-open';
            spawn(command, [`file://${adminPath}`], { shell: true });
        } else {
            console.log('❌ 找不到管理後台檔案');
        }
    }

    /**
     * 執行同步
     */
    async executeSync() {
        console.log('🔄 開始跨裝置同步...');

        // TODO: 實作同步邏輯
        // 1. OneDrive 同步檢查
        // 2. Git 狀態檢查
        // 3. 配置檔案同步

        console.log('📋 同步功能開發中...');
        console.log('💾 將整合 OneDrive + Git 雙重同步');
    }

    /**
     * 顯示狀態
     */
    showStatus() {
        console.log('\n📊 Claude Code 系統狀態\n');
        console.log(`🖥️  設備: ${this.deviceConfig.name}`);
        console.log(`📂 專案: ${path.basename(this.projectRoot)}`);
        console.log(`⚙️  配置: ${this.deviceConfig.profile}`);
        console.log(`🔄 最後同步: ${this.deviceConfig.lastSync}`);
        console.log(`📚 可用指令: ${this.commands.size} 個`);
        console.log('');
    }
}

// 匯出主類別
module.exports = ClaudeCodeLauncher;

// 如果直接執行此檔案，啟動互動模式
if (require.main === module) {
    const launcher = new ClaudeCodeLauncher();

    // 簡單的互動模式
    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: '🎯 CC> '
    });

    console.log('\n💡 輸入指令或 "exit" 離開');
    rl.prompt();

    rl.on('line', async (line) => {
        const input = line.trim();

        if (input === 'exit' || input === 'quit') {
            console.log('👋 Claude Code 已關閉');
            rl.close();
            return;
        }

        if (input) {
            await launcher.execute(input);
        }

        rl.prompt();
    });
}