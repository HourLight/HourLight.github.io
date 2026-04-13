/**
 * Claude Code 指令註冊表 v1.0
 * 馥靈之鑰 - 統一指令管理系統
 *
 * 功能：
 * - 動態指令註冊
 * - 別名管理
 * - 指令分類
 * - 使用統計
 */

const fs = require('fs');
const path = require('path');

class CCRegistry {
    constructor(configDir) {
        this.configDir = configDir;
        this.commands = new Map();
        this.aliases = new Map();
        this.categories = new Map();
        this.usage = new Map();

        this.registryFile = path.join(configDir, 'shared', 'command-registry.json');
        this.usageFile = path.join(configDir, 'shared', 'usage-stats.json');

        this.loadRegistry();
        this.loadUsageStats();
    }

    /**
     * 註冊指令
     * @param {string} name 指令名稱
     * @param {Object} config 指令配置
     */
    register(name, config) {
        const command = {
            name,
            description: config.description || '',
            aliases: config.aliases || [],
            category: config.category || 'misc',
            execute: config.execute,
            permissions: config.permissions || [],
            examples: config.examples || [],
            registeredAt: new Date().toISOString(),
            ...config
        };

        // 註冊主指令
        this.commands.set(name, command);

        // 註冊別名
        command.aliases.forEach(alias => {
            this.aliases.set(alias, name);
        });

        // 分類管理
        if (!this.categories.has(command.category)) {
            this.categories.set(command.category, []);
        }
        this.categories.get(command.category).push(name);

        // 初始化使用統計
        if (!this.usage.has(name)) {
            this.usage.set(name, {
                count: 0,
                lastUsed: null,
                avgResponseTime: 0
            });
        }

        console.log(`✅ 已註冊指令: ${name} (別名: ${command.aliases.join(', ') || '無'})`);

        this.saveRegistry();
        return command;
    }

    /**
     * 取得指令
     * @param {string} nameOrAlias 指令名稱或別名
     * @returns {Object|null} 指令物件
     */
    get(nameOrAlias) {
        // 直接查詢
        if (this.commands.has(nameOrAlias)) {
            return this.commands.get(nameOrAlias);
        }

        // 透過別名查詢
        if (this.aliases.has(nameOrAlias)) {
            const realName = this.aliases.get(nameOrAlias);
            return this.commands.get(realName);
        }

        return null;
    }

    /**
     * 檢查指令是否存在
     * @param {string} nameOrAlias 指令名稱或別名
     * @returns {boolean}
     */
    has(nameOrAlias) {
        return this.commands.has(nameOrAlias) || this.aliases.has(nameOrAlias);
    }

    /**
     * 取得所有指令
     * @returns {Map} 所有指令
     */
    getAll() {
        return this.commands;
    }

    /**
     * 依分類取得指令
     * @param {string} category 分類名稱
     * @returns {Array} 指令列表
     */
    getByCategory(category) {
        if (!this.categories.has(category)) {
            return [];
        }

        return this.categories.get(category).map(name => this.commands.get(name));
    }

    /**
     * 取得所有分類
     * @returns {Array} 分類列表
     */
    getCategories() {
        return Array.from(this.categories.keys());
    }

    /**
     * 搜尋指令
     * @param {string} query 搜尋關鍵字
     * @returns {Array} 匹配的指令列表
     */
    search(query) {
        const results = [];
        const lowerQuery = query.toLowerCase();

        for (const [name, command] of this.commands) {
            // 搜尋指令名稱
            if (name.toLowerCase().includes(lowerQuery)) {
                results.push({ command, match: 'name', score: 10 });
                continue;
            }

            // 搜尋別名
            const aliasMatch = command.aliases.some(alias =>
                alias.toLowerCase().includes(lowerQuery)
            );
            if (aliasMatch) {
                results.push({ command, match: 'alias', score: 8 });
                continue;
            }

            // 搜尋描述
            if (command.description.toLowerCase().includes(lowerQuery)) {
                results.push({ command, match: 'description', score: 5 });
                continue;
            }

            // 搜尋分類
            if (command.category.toLowerCase().includes(lowerQuery)) {
                results.push({ command, match: 'category', score: 3 });
            }
        }

        // 按分數排序
        return results
            .sort((a, b) => b.score - a.score)
            .map(result => result.command);
    }

    /**
     * 記錄指令使用
     * @param {string} name 指令名稱
     * @param {number} responseTime 回應時間（毫秒）
     */
    recordUsage(name, responseTime = 0) {
        if (!this.usage.has(name)) {
            this.usage.set(name, {
                count: 0,
                lastUsed: null,
                avgResponseTime: 0
            });
        }

        const stats = this.usage.get(name);
        stats.count++;
        stats.lastUsed = new Date().toISOString();

        // 計算平均回應時間
        if (responseTime > 0) {
            if (stats.avgResponseTime === 0) {
                stats.avgResponseTime = responseTime;
            } else {
                stats.avgResponseTime = (stats.avgResponseTime + responseTime) / 2;
            }
        }

        this.saveUsageStats();
    }

    /**
     * 取得使用統計
     * @param {string} name 指令名稱
     * @returns {Object} 使用統計
     */
    getUsageStats(name) {
        return this.usage.get(name) || {
            count: 0,
            lastUsed: null,
            avgResponseTime: 0
        };
    }

    /**
     * 取得熱門指令
     * @param {number} limit 限制數量
     * @returns {Array} 熱門指令列表
     */
    getPopularCommands(limit = 10) {
        const commands = Array.from(this.usage.entries())
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, limit)
            .map(([name, stats]) => ({
                name,
                command: this.commands.get(name),
                stats
            }));

        return commands;
    }

    /**
     * 取得最近使用的指令
     * @param {number} limit 限制數量
     * @returns {Array} 最近使用指令列表
     */
    getRecentCommands(limit = 10) {
        const commands = Array.from(this.usage.entries())
            .filter(([name, stats]) => stats.lastUsed)
            .sort((a, b) => new Date(b[1].lastUsed) - new Date(a[1].lastUsed))
            .slice(0, limit)
            .map(([name, stats]) => ({
                name,
                command: this.commands.get(name),
                stats
            }));

        return commands;
    }

    /**
     * 載入指令註冊表
     */
    loadRegistry() {
        if (fs.existsSync(this.registryFile)) {
            try {
                const data = JSON.parse(fs.readFileSync(this.registryFile, 'utf8'));

                // 重建指令對應表（不包含 execute 函數）
                if (data.commands) {
                    Object.entries(data.commands).forEach(([name, command]) => {
                        // 只載入配置，不載入執行函數
                        this.commands.set(name, {
                            ...command,
                            execute: null // 需要重新註冊
                        });
                    });
                }

                if (data.aliases) {
                    this.aliases = new Map(Object.entries(data.aliases));
                }

                if (data.categories) {
                    this.categories = new Map(Object.entries(data.categories));
                }

                console.log('📚 已載入指令註冊表');
            } catch (error) {
                console.warn('⚠️ 指令註冊表載入失敗:', error.message);
            }
        }
    }

    /**
     * 儲存指令註冊表
     */
    saveRegistry() {
        const data = {
            commands: Object.fromEntries(
                Array.from(this.commands.entries()).map(([name, command]) => [
                    name,
                    {
                        ...command,
                        execute: null // 不儲存函數
                    }
                ])
            ),
            aliases: Object.fromEntries(this.aliases),
            categories: Object.fromEntries(this.categories),
            lastUpdated: new Date().toISOString()
        };

        try {
            fs.writeFileSync(this.registryFile, JSON.stringify(data, null, 2));
        } catch (error) {
            console.warn('⚠️ 指令註冊表儲存失敗:', error.message);
        }
    }

    /**
     * 載入使用統計
     */
    loadUsageStats() {
        if (fs.existsSync(this.usageFile)) {
            try {
                const data = JSON.parse(fs.readFileSync(this.usageFile, 'utf8'));
                this.usage = new Map(Object.entries(data.usage || {}));
                console.log('📊 已載入使用統計');
            } catch (error) {
                console.warn('⚠️ 使用統計載入失敗:', error.message);
            }
        }
    }

    /**
     * 儲存使用統計
     */
    saveUsageStats() {
        const data = {
            usage: Object.fromEntries(this.usage),
            lastUpdated: new Date().toISOString()
        };

        try {
            fs.writeFileSync(this.usageFile, JSON.stringify(data, null, 2));
        } catch (error) {
            console.warn('⚠️ 使用統計儲存失敗:', error.message);
        }
    }

    /**
     * 產生指令說明
     * @returns {string} 格式化的說明文字
     */
    generateHelp() {
        let help = '\n🎯 Claude Code 指令大全\n\n';

        // 按分類顯示
        for (const category of this.getCategories()) {
            const commands = this.getByCategory(category);
            if (commands.length === 0) continue;

            help += `📂 ${category.toUpperCase()}\n`;

            commands.forEach(command => {
                const aliases = command.aliases.length > 0 ?
                    ` (${command.aliases.join(', ')})` : '';
                const usage = this.getUsageStats(command.name);
                const usageText = usage.count > 0 ? ` [使用 ${usage.count} 次]` : '';

                help += `  ${command.name}${aliases} - ${command.description}${usageText}\n`;

                if (command.examples && command.examples.length > 0) {
                    help += `    範例: ${command.examples[0]}\n`;
                }
            });

            help += '\n';
        }

        // 熱門指令
        const popular = this.getPopularCommands(5);
        if (popular.length > 0) {
            help += '🔥 熱門指令\n';
            popular.forEach(({ name, stats }, index) => {
                help += `  ${index + 1}. ${name} (${stats.count} 次)\n`;
            });
            help += '\n';
        }

        help += '🚀 馥靈之鑰 Claude Code 系統\n';
        help += '💡 輸入指令名稱執行，或使用別名快捷操作\n';

        return help;
    }
}

module.exports = CCRegistry;