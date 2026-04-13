/**
 * Claude Code - SEO Noindex 掃描指令
 * 馥靈之鑰專用：全站 noindex 封鎖問題檢測
 */

const fs = require('fs');
const path = require('path');

class NoindexScanner {
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
        this.results = {
            total: 0,
            noindexBlocked: [],
            missingRobots: [],
            missingKeywords: [],
            missingOGType: [],
            missingTwitterCards: [],
            fullyOptimized: [],
            issues: []
        };
    }

    /**
     * 執行全站 noindex 掃描
     */
    async scan() {
        console.log('🔍 開始全站 noindex 封鎖問題掃描...');
        console.log(`📁 掃描目錄: ${this.projectRoot}`);

        try {
            // 找出所有 HTML 檔案（排除不需要的目錄）
            const htmlFiles = await this.findHtmlFiles();
            console.log(`📄 找到 ${htmlFiles.length} 個 HTML 檔案`);

            // 掃描每個檔案
            for (const file of htmlFiles) {
                await this.scanFile(file);
            }

            // 產生報告
            this.generateReport();

        } catch (error) {
            console.error('❌ 掃描過程發生錯誤:', error.message);
            throw error;
        }
    }

    /**
     * 找出所有需要掃描的 HTML 檔案
     */
    async findHtmlFiles() {
        const files = [];

        // 遞迴掃描目錄
        const scanDirectory = (dir, relativePath = '') => {
            try {
                const items = fs.readdirSync(dir);

                for (const item of items) {
                    const fullPath = path.join(dir, item);
                    const relativeFile = path.join(relativePath, item).replace(/\\/g, '/');

                    // 跳過不需要的目錄
                    if (item === 'node_modules' || item === '.git' || item === 'cc-launcher') {
                        continue;
                    }

                    const stat = fs.statSync(fullPath);

                    if (stat.isDirectory()) {
                        // 遞迴掃描子目錄
                        scanDirectory(fullPath, relativeFile);
                    } else if (stat.isFile() && item.endsWith('.html')) {
                        // 跳過特定檔案
                        if (item.startsWith('admin-') || item.startsWith('test')) {
                            continue;
                        }

                        files.push(relativeFile);
                    }
                }
            } catch (error) {
                console.warn(`⚠️ 無法掃描目錄 ${dir}:`, error.message);
            }
        };

        scanDirectory(this.projectRoot);

        // 排序
        return files.sort();
    }

    /**
     * 掃描單個檔案
     */
    async scanFile(filePath) {
        const fullPath = path.join(this.projectRoot, filePath);

        try {
            const content = fs.readFileSync(fullPath, 'utf8');
            const issues = this.analyzeContent(content, filePath);

            this.results.total++;

            if (issues.length === 0) {
                this.results.fullyOptimized.push(filePath);
            } else {
                this.results.issues.push({
                    file: filePath,
                    issues: issues
                });

                // 分類問題
                issues.forEach(issue => {
                    switch (issue.type) {
                        case 'noindex':
                            this.results.noindexBlocked.push(filePath);
                            break;
                        case 'missing_robots':
                            this.results.missingRobots.push(filePath);
                            break;
                        case 'missing_keywords':
                            this.results.missingKeywords.push(filePath);
                            break;
                        case 'missing_ogtype':
                            this.results.missingOGType.push(filePath);
                            break;
                        case 'missing_twitter':
                            this.results.missingTwitterCards.push(filePath);
                            break;
                    }
                });
            }

        } catch (error) {
            console.warn(`⚠️ 無法讀取檔案 ${filePath}:`, error.message);
        }
    }

    /**
     * 分析檔案內容
     */
    analyzeContent(content, filePath) {
        const issues = [];

        // 檢查 noindex 標記
        if (this.hasNoindex(content)) {
            issues.push({
                type: 'noindex',
                message: '🚨 發現 noindex 標記，將被搜索引擎排除',
                severity: 'critical'
            });
        }

        // 檢查 robots meta 標記
        if (!this.hasRobotsMeta(content)) {
            issues.push({
                type: 'missing_robots',
                message: '❌ 缺少 robots meta 標記',
                severity: 'high'
            });
        }

        // 檢查關鍵字
        if (!this.hasKeywords(content)) {
            issues.push({
                type: 'missing_keywords',
                message: '❌ 缺少 meta keywords',
                severity: 'medium'
            });
        }

        // 檢查 Open Graph type
        if (!this.hasOGType(content)) {
            issues.push({
                type: 'missing_ogtype',
                message: '❌ 缺少 og:type',
                severity: 'medium'
            });
        }

        // 檢查 Twitter Cards
        if (!this.hasTwitterCards(content)) {
            issues.push({
                type: 'missing_twitter',
                message: '❌ 缺少 Twitter Cards',
                severity: 'low'
            });
        }

        return issues;
    }

    /**
     * 檢測是否有 noindex 標記
     */
    hasNoindex(content) {
        return /robots[^>]*noindex/i.test(content);
    }

    /**
     * 檢測是否有 robots meta 標記
     */
    hasRobotsMeta(content) {
        return /name=["\']robots["\'][^>]*content=["\'][^"']*index/i.test(content);
    }

    /**
     * 檢測是否有 meta keywords
     */
    hasKeywords(content) {
        return /name=["\']keywords["\']/i.test(content);
    }

    /**
     * 檢測是否有 og:type
     */
    hasOGType(content) {
        return /property=["\']og:type["\']/i.test(content);
    }

    /**
     * 檢測是否有 Twitter Cards
     */
    hasTwitterCards(content) {
        return /name=["\']twitter:card["\']/i.test(content);
    }

    /**
     * 產生詳細報告
     */
    generateReport() {
        console.log('\n📊 全站 SEO 掃描報告\n');

        // 總覽
        console.log('📋 總覽統計');
        console.log(`  總檔案數: ${this.results.total}`);
        console.log(`  完全優化: ${this.results.fullyOptimized.length} (${(this.results.fullyOptimized.length/this.results.total*100).toFixed(1)}%)`);
        console.log(`  有問題的: ${this.results.issues.length} (${(this.results.issues.length/this.results.total*100).toFixed(1)}%)`);
        console.log('');

        // 嚴重問題
        if (this.results.noindexBlocked.length > 0) {
            console.log('🚨 嚴重：noindex 封鎖問題');
            this.results.noindexBlocked.forEach(file => {
                console.log(`  ❌ ${file}`);
            });
            console.log(`  影響檔案: ${this.results.noindexBlocked.length} 個`);
            console.log('');
        }

        // 缺少 robots
        if (this.results.missingRobots.length > 0) {
            console.log('⚠️ 高優先級：缺少 robots meta');
            console.log(`  影響檔案: ${this.results.missingRobots.length} 個`);
            this.results.missingRobots.slice(0, 5).forEach(file => {
                console.log(`    • ${file}`);
            });
            if (this.results.missingRobots.length > 5) {
                console.log(`    ... 還有 ${this.results.missingRobots.length - 5} 個檔案`);
            }
            console.log('');
        }

        // 其他優化建議
        console.log('💡 其他優化建議');
        console.log(`  缺少關鍵字: ${this.results.missingKeywords.length} 個檔案`);
        console.log(`  缺少 og:type: ${this.results.missingOGType.length} 個檔案`);
        console.log(`  缺少 Twitter Cards: ${this.results.missingTwitterCards.length} 個檔案`);
        console.log('');

        // 建議修復指令
        this.generateFixSuggestions();
    }

    /**
     * 產生修復建議
     */
    generateFixSuggestions() {
        console.log('🔧 建議修復步驟');

        if (this.results.noindexBlocked.length > 0) {
            console.log('\n1️⃣ 緊急修復 noindex 問題：');
            this.results.noindexBlocked.forEach(file => {
                console.log(`  cc fix-noindex ${file}`);
            });
        }

        if (this.results.missingRobots.length > 0) {
            console.log('\n2️⃣ 批量新增 robots meta：');
            console.log(`  cc batch-robots ${this.results.missingRobots.length} files`);
        }

        if (this.results.missingKeywords.length > 0) {
            console.log('\n3️⃣ SEO 完整優化：');
            console.log(`  cc seo-optimize ${this.results.missingKeywords.length} files`);
        }

        console.log('\n📞 需要幫助？使用: cc seo help');
    }

    /**
     * 匯出詳細資料到檔案
     */
    exportReport() {
        // 確保 .cc-config 目錄存在
        const ccConfigDir = path.join(this.projectRoot, '.cc-config');
        if (!fs.existsSync(ccConfigDir)) {
            fs.mkdirSync(ccConfigDir, { recursive: true });
        }

        const reportPath = path.join(ccConfigDir, 'seo-scan-report.json');

        const reportData = {
            scanTime: new Date().toISOString(),
            summary: {
                total: this.results.total,
                fullyOptimized: this.results.fullyOptimized.length,
                hasIssues: this.results.issues.length,
                criticalIssues: this.results.noindexBlocked.length
            },
            details: this.results,
            recommendations: {
                priority1: this.results.noindexBlocked,
                priority2: this.results.missingRobots,
                priority3: this.results.missingKeywords
            }
        };

        try {
            fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
            console.log(`\n💾 詳細報告已儲存: ${reportPath}`);
        } catch (error) {
            console.warn('⚠️ 無法儲存報告檔案:', error.message);
        }
    }
}

/**
 * CC 指令執行函數
 */
async function execute() {
    // 確保掃描的是馥靈之鑰專案根目錄
    const projectRoot = path.resolve(__dirname, '..', '..', '..');
    const scanner = new NoindexScanner(projectRoot);

    try {
        await scanner.scan();
        scanner.exportReport();

        console.log('\n✅ 全站 noindex 掃描完成！');
        console.log('🎯 使用 cc seo fix 開始修復');

        return true;
    } catch (error) {
        console.error('\n❌ 掃描失敗:', error.message);
        return false;
    }
}

module.exports = {
    name: 'cc seo scan',
    description: '全站 noindex 封鎖問題掃描',
    aliases: ['cc scan', 'cc noindex'],
    category: 'seo',
    execute: execute,
    examples: [
        'cc seo scan',
        'cc scan',
        'cc noindex'
    ]
};