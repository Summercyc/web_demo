// 全局状态管理
class AppState {
    constructor() {
        this.sessions = [];
        this.currentSession = null;
        this.config = {
            aiProvider: 'dashscope',
            apiKey: '',
            textModel: 'qwen-plus',
            googleCseId: '',
            enableAnimations: true
        };
        this.growthData = {
            level: 1,
            conversations: 0,
            cards: 0,
            actions: 0,
            flowers: 0,
            treeType: 'oak',
            achievements: [],
            season: 'spring'
        };
        this.reflectionCards = [];
        this.monthlyReports = [];
        this.loadFromStorage();
    }

    loadFromStorage() {
        const savedConfig = localStorage.getItem('aiRoundtableConfig');
        if (savedConfig) {
            this.config = { ...this.config, ...JSON.parse(savedConfig) };
        }

        const savedSessions = localStorage.getItem('aiRoundtableSessions');
        if (savedSessions) {
            this.sessions = JSON.parse(savedSessions);
        }

        const savedGrowthData = localStorage.getItem('aiRoundtableGrowth');
        if (savedGrowthData) {
            this.growthData = { ...this.growthData, ...JSON.parse(savedGrowthData) };
        }
        
        const savedReflectionCards = localStorage.getItem('aiRoundtableReflectionCards');
        if (savedReflectionCards) {
            this.reflectionCards = JSON.parse(savedReflectionCards);
        }
        
        const savedMonthlyReports = localStorage.getItem('aiRoundtableMonthlyReports');
        if (savedMonthlyReports) {
            this.monthlyReports = JSON.parse(savedMonthlyReports);
        }
    }

    saveToStorage() {
        localStorage.setItem('aiRoundtableConfig', JSON.stringify(this.config));
        localStorage.setItem('aiRoundtableSessions', JSON.stringify(this.sessions));
        localStorage.setItem('aiRoundtableGrowth', JSON.stringify(this.growthData));
        localStorage.setItem('aiRoundtableReflectionCards', JSON.stringify(this.reflectionCards));
        localStorage.setItem('aiRoundtableMonthlyReports', JSON.stringify(this.monthlyReports));
    }

    createSession(title, aiRoles) {
        const session = {
            id: Date.now().toString(),
            title: title || `AI圆桌 · ${new Date().toLocaleDateString()}`,
            aiRoles: aiRoles,
            messages: [],
            createdAt: new Date().toISOString()
        };
        this.sessions.unshift(session);
        this.currentSession = session;
        this.saveToStorage();
        return session;
    }

    addMessage(message) {
        if (this.currentSession) {
            this.currentSession.messages.push({
                ...message,
                id: Date.now().toString(),
                timestamp: new Date().toISOString()
            });
            this.saveToStorage();
        }
    }

    updateGrowthData(type, data = {}) {
        switch (type) {
            case 'conversation':
                this.growthData.conversations++;
                break;
            case 'card':
                this.growthData.cards++;
                // 检查是否需要浇水
                this.waterTree();
                break;
            case 'action':
                this.growthData.actions++;
                // 检查是否需要长叶子
                this.growLeaf();
                break;
            case 'insight':
                // 检查是否需要开花
                this.growFlower();
                break;
        }
        
        // 计算等级
        const totalPoints = this.growthData.conversations + this.growthData.cards * 2 + this.growthData.actions * 3;
        const newLevel = Math.floor(totalPoints / 10) + 1;
        
        // 如果等级提升，检查成就
        if (newLevel > this.growthData.level) {
            this.growthData.level = newLevel;
            this.checkAchievements();
        }
        
        this.saveToStorage();
    }
    
    // 成长树养成系统方法
    waterTree() {
        // 浇水逻辑
        if (this.growthData.cards % 3 === 0) {
            // 每3张卡片，检查是否需要更新季节
            this.updateSeason();
        }
    }
    
    growLeaf() {
        // 长叶子逻辑
        if (this.growthData.actions % 5 === 0) {
            // 每5个行动，检查是否需要升级树木
            this.upgradeTree();
        }
    }
    
    growFlower() {
        // 开花逻辑
        this.growthData.flowers++;
        
        // 添加开花成就
        if (this.growthData.flowers === 1) {
            this.addAchievement('first_flower', '初绽', '你的成长树开出了第一朵花！');
        } else if (this.growthData.flowers === 10) {
            this.addAchievement('flower_garden', '繁花似锦', '你的成长树已开出10朵花！');
        }
    }
    
    updateSeason() {
        // 季节更新逻辑
        const seasons = ['spring', 'summer', 'autumn', 'winter'];
        const currentIndex = seasons.indexOf(this.growthData.season);
        const nextIndex = (currentIndex + 1) % seasons.length;
        this.growthData.season = seasons[nextIndex];
    }
    
    upgradeTree() {
        // 树木升级逻辑
        if (this.growthData.level >= 10 && !this.hasAchievement('mature_tree')) {
            this.addAchievement('mature_tree', '茁壮成长', '你的成长树已经成长为一棵茂盛的大树！');
        }
    }
    
    checkAchievements() {
        // 检查是否达成新成就
        
        // 连续7天参与
        const today = new Date().toLocaleDateString();
        const lastWeek = new Array(7).fill().map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toLocaleDateString();
        });
        
        // 检查最近7天是否每天都有对话
        const hasDialogues = lastWeek.every(date => {
            return this.sessions.some(session => {
                return session.messages.some(msg => {
                    const msgDate = new Date(msg.timestamp).toLocaleDateString();
                    return msgDate === date;
                });
            });
        });
        
        if (hasDialogues && !this.hasAchievement('seven_day_streak')) {
            this.addAchievement('seven_day_streak', '破土者', '连续7天参与对话，坚持的力量！');
        }
        
        // 等级成就
        if (this.growthData.level >= 5 && !this.hasAchievement('level_5')) {
            this.addAchievement('level_5', '茁壮幼苗', '成长等级达到5级！');
        } else if (this.growthData.level >= 10 && !this.hasAchievement('level_10')) {
            this.addAchievement('level_10', '挺拔小树', '成长等级达到10级！');
        } else if (this.growthData.level >= 20 && !this.hasAchievement('level_20')) {
            this.addAchievement('level_20', '参天大树', '成长等级达到20级！');
        }
    }
    
    hasAchievement(id) {
        return this.growthData.achievements.some(a => a.id === id);
    }
    
    addAchievement(id, title, description) {
        if (!this.hasAchievement(id)) {
            this.growthData.achievements.push({
                id,
                title,
                description,
                date: new Date().toISOString()
            });
            this.saveToStorage();
            return true;
        }
        return false;
    }
    
    // 复盘卡片方法
    addReflectionCard(card) {
        card.id = Date.now().toString();
        card.createdAt = new Date().toISOString();
        this.reflectionCards.unshift(card);
        this.updateGrowthData('card');
        this.saveToStorage();
        
        // 检查是否需要生成月报
        this.checkMonthlyReport();
        
        return card;
    }
    
    checkMonthlyReport() {
        const today = new Date();
        const isFirstDayOfMonth = today.getDate() === 1;
        
        if (isFirstDayOfMonth) {
            // 获取上个月的数据
            const lastMonth = today.getMonth() === 0 ? 11 : today.getMonth() - 1;
            const lastMonthYear = today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear();
            const lastMonthName = new Date(lastMonthYear, lastMonth, 1).toLocaleString('zh-CN', { month: 'long' });
            
            // 检查是否已经生成了本月的月报
            const hasReport = this.monthlyReports.some(report => {
                const reportDate = new Date(report.createdAt);
                return reportDate.getMonth() === today.getMonth() && reportDate.getFullYear() === today.getFullYear();
            });
            
            if (!hasReport) {
                this.generateMonthlyReport(lastMonth, lastMonthYear, lastMonthName);
            }
        }
    }
    
    generateMonthlyReport(month, year, monthName) {
        // 获取该月的卡片
        const monthCards = this.reflectionCards.filter(card => {
            const cardDate = new Date(card.createdAt);
            return cardDate.getMonth() === month && cardDate.getFullYear() === year;
        });
        
        // 如果没有卡片，不生成报告
        if (monthCards.length === 0) return;
        
        // 生成月报
        const report = {
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            month,
            year,
            monthName,
            treeLevel: this.growthData.level,
            treeStage: this.getTreeStage(),
            actionCompletion: {
                completed: this.growthData.actions,
                total: this.growthData.actions + Math.floor(Math.random() * 5) // 模拟一些未完成的行动
            },
            commonPhrases: this.getCommonPhrases(),
            breakthroughMoment: this.getBreakthroughMoment(monthCards),
            cognitiveUpgrade: this.getCognitiveUpgrade(monthCards),
            flowers: this.growthData.flowers,
            achievements: this.growthData.achievements.filter(a => {
                const achieveDate = new Date(a.date);
                return achieveDate.getMonth() === month && achieveDate.getFullYear() === year;
            }),
            emotionalRecovery: Math.floor(Math.random() * 30) + 10 // 模拟情绪恢复速度提升
        };
        
        this.monthlyReports.unshift(report);
        this.saveToStorage();
    }
    
    getTreeStage() {
        const level = this.growthData.level;
        if (level <= 3) return '幼苗期';
        if (level <= 7) return '成长期';
        if (level <= 12) return '繁茂期';
        return '成熟期';
    }
    
    getCommonPhrases() {
        // 模拟常用短语
        const phrases = [
            "我可以换个方式试试",
            "让我思考一下",
            "这个问题需要从多角度看",
            "我明白了，下次我会注意",
            "谢谢你的建议"
        ];
        return phrases[Math.floor(Math.random() * phrases.length)];
    }
    
    getBreakthroughMoment(cards) {
        // 从卡片中提取突破时刻
        if (cards.length === 0) return "暂无突破时刻";
        
        // 模拟一些突破时刻
        const breakthroughs = [
            "第一次在会议上反驳不合理安排",
            "成功处理了一次团队冲突",
            "提出的创新方案被采纳",
            "克服了公开演讲的恐惧",
            "学会了设定健康的边界"
        ];
        
        return breakthroughs[Math.floor(Math.random() * breakthroughs.length)];
    }
    
    getCognitiveUpgrade(cards) {
        // 从卡片中提取认知升级
        if (cards.length === 0) return "暂无认知升级";
        
        // 模拟一些认知升级
        const upgrades = [
            "开始区分'责任'与'义务'",
            "认识到反馈不等于批评",
            "理解了情绪背后的需求",
            "学会了在冲突中寻找共同点",
            "发现了自己的核心价值观"
        ];
        
        return upgrades[Math.floor(Math.random() * upgrades.length)];
    }
}

// AI角色定义
const AI_ROLES = {
    coach: {
        name: 'Coach 小柯',
        emoji: '💡',
        color: '#10B981',
        description: '成长引导者',
        systemPrompt: '你是一位温和的成长引导者，擅长通过提问帮助用户思考和成长。你的回复应该温和、启发性强，多使用开放式问题引导用户深入思考。'
    },
    strategist: {
        name: 'Strategist 老谋',
        emoji: '🧠',
        color: '#3B82F6',
        description: '战略顾问',
        systemPrompt: '你是一位理性的战略顾问，擅长分析问题、制定计划和权衡利弊。你的回复应该逻辑清晰、结构化强，提供具体的框架和方法。'
    },
    psychologist: {
        name: 'Psychologist 心理姐',
        emoji: '💖',
        color: '#EC4899',
        description: '情绪伙伴',
        systemPrompt: '你是一位温暖的心理伙伴，擅长共情和情绪支持。你的回复应该充满理解和关怀，帮助用户处理情绪问题，提供心理支持。'
    },
    operator: {
        name: 'Operator 阿操',
        emoji: '⚡',
        color: '#F59E0B',
        description: '落地专家',
        systemPrompt: '你是一位高效的执行专家，擅长提供具体的行动方案和实用建议。你的回复应该直接、实用，提供可操作的步骤和方法。'
    }
};

// 主应用类
class AIRoundtableApp {
    constructor() {
        this.state = new AppState();
        this.currentTyping = null;
        this.treeImageCache = {}; // 缓存树木图片
        this.forestTrees = []; // 成长森林中的树木
        this.init();
    }

    init() {
        this.bindEvents();
        this.renderSessions();
        this.updateConfigUI();
        this.updateGrowthUI();
        
        // 确保界面元素默认显示
        document.getElementById('aiRoleBar').style.display = 'block';
        document.getElementById('inputArea').style.display = 'block';
        document.getElementById('newRoundtableBtn').style.display = 'block';
        document.getElementById('sendBtn').style.display = 'block';
        document.getElementById('saveConfig').style.display = 'block';
    }

    bindEvents() {
        // 新建圆桌
        document.getElementById('newRoundtableBtn').addEventListener('click', () => {
            this.showNewRoundtableModal();
        });

        // 配置中心
        document.getElementById('configBtn').addEventListener('click', () => {
            this.showConfigModal();
        });

        // 成长日志
        document.getElementById('growthLogBtn').addEventListener('click', () => {
            this.showGrowthLogModal();
        });

        // 发送消息
        document.getElementById('sendBtn').addEventListener('click', () => {
            this.sendMessage();
        });

        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // 复盘功能
        document.getElementById('quickReflectBtn').addEventListener('click', () => {
            this.showReflectModal('quick');
        });

        document.getElementById('deepReflectBtn').addEventListener('click', () => {
            this.showReflectModal('deep');
        });

        // 模态框事件
        this.bindModalEvents();

        // 搜索功能
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.searchSessions(e.target.value);
        });
    }

    bindModalEvents() {
        // 新建圆桌模态框
        document.getElementById('cancelRoundtable').addEventListener('click', () => {
            this.hideNewRoundtableModal();
        });

        document.getElementById('createRoundtable').addEventListener('click', () => {
            this.createNewRoundtable();
        });

        // 配置模态框
        document.getElementById('cancelConfig').addEventListener('click', () => {
            this.hideConfigModal();
        });

        document.getElementById('saveConfig').addEventListener('click', () => {
            this.saveConfig();
        });

        // 成长日志模态框
        document.getElementById('closeGrowthLog').addEventListener('click', () => {
            this.hideGrowthLogModal();
        });

        // 成长日志标签切换
        document.querySelectorAll('.growth-tab-macaron').forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchGrowthTab(tab.dataset.target);
            });
        });

        // 树木类型选择
        document.querySelectorAll('input[name="treeType"]').forEach(input => {
            input.addEventListener('change', (e) => {
                this.changeTreeType(e.target.value);
            });
        });

        // 卡片筛选
        document.getElementById('cardTimeFilter').addEventListener('change', () => {
            this.filterCards();
        });
        
        document.getElementById('cardTagFilter').addEventListener('change', () => {
            this.filterCards();
        });

        // 复盘模态框
        document.getElementById('cancelReflect').addEventListener('click', () => {
            this.hideReflectModal();
        });

        document.getElementById('createReflectCard').addEventListener('click', () => {
            this.createReflectionCard();
        });
        
        // 深潜复盘导航按钮
        document.getElementById('prevQuestion').addEventListener('click', () => {
            this.saveCurrentAnswer();
            this.currentQuestionIndex--;
            this.showCurrentQuestion();
        });
        
        document.getElementById('nextQuestion').addEventListener('click', () => {
            this.saveCurrentAnswer();
            
            if (this.currentQuestionIndex === this.reflectQuestions.length - 1) {
                // 最后一个问题，准备生成复盘卡片
                this.createDeepReflectionCard();
            } else {
                this.currentQuestionIndex++;
                this.showCurrentQuestion();
            }
        });

        // AI平台切换
        document.getElementById('aiProvider').addEventListener('change', (e) => {
            this.updateModelOptions(e.target.value);
        });

        // 点击模态框外部关闭
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('fixed') && e.target.classList.contains('bg-black')) {
                this.hideAllModals();
            }
        });
    }

    showNewRoundtableModal() {
        const modal = document.getElementById('newRoundtableModal');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        modal.querySelector('.bg-white').classList.add('modal-enter');
    }

    hideNewRoundtableModal() {
        document.getElementById('newRoundtableModal').classList.add('hidden');
        document.getElementById('newRoundtableModal').classList.remove('flex');
    }

    createNewRoundtable() {
        const selectedRoles = Array.from(document.querySelectorAll('input[name="aiRole"]:checked'))
            .map(input => input.value);

        if (selectedRoles.length === 0) {
            alert('请至少选择一个AI伙伴');
            return;
        }

        const session = this.state.createSession(null, selectedRoles);
        this.renderSessions();
        this.switchToSession(session);
        this.hideNewRoundtableModal();

        // 重置选择
        document.querySelectorAll('input[name="aiRole"]').forEach(input => {
            input.checked = false;
        });
    }

    showConfigModal() {
        const modal = document.getElementById('configModal');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        modal.querySelector('.bg-white').classList.add('modal-enter');
        this.updateConfigUI();
    }

    hideConfigModal() {
        document.getElementById('configModal').classList.add('hidden');
        document.getElementById('configModal').classList.remove('flex');
    }

    updateConfigUI() {
        document.getElementById('aiProvider').value = this.state.config.aiProvider;
        document.getElementById('apiKey').value = this.state.config.apiKey;
        document.getElementById('textModel').value = this.state.config.textModel;
        document.getElementById('googleCseId').value = this.state.config.googleCseId;
        document.getElementById('enableAnimations').checked = this.state.config.enableAnimations;
        
        this.updateModelOptions(this.state.config.aiProvider);
    }

    updateModelOptions(provider) {
        const modelSelect = document.getElementById('textModel');
        modelSelect.innerHTML = '';

        if (provider === 'dashscope') {
            const models = ['qwen-plus', 'qwen-max', 'qwen-turbo'];
            models.forEach(model => {
                const option = document.createElement('option');
                option.value = model;
                option.textContent = model;
                modelSelect.appendChild(option);
            });
        } else if (provider === 'openrouter') {
            const models = [
                'openai/gpt-4o',
                'openai/gpt-4o-mini',
                'anthropic/claude-3.5-sonnet',
                'qwen/qwen-2.5-72b-instruct'
            ];
            models.forEach(model => {
                const option = document.createElement('option');
                option.value = model;
                option.textContent = model;
                modelSelect.appendChild(option);
            });
        }
    }

    saveConfig() {
        this.state.config = {
            aiProvider: document.getElementById('aiProvider').value,
            apiKey: document.getElementById('apiKey').value,
            textModel: document.getElementById('textModel').value,
            googleCseId: document.getElementById('googleCseId').value,
            enableAnimations: document.getElementById('enableAnimations').checked
        };
        this.state.saveToStorage();
        this.hideConfigModal();
        alert('配置已保存');
    }

    showGrowthLogModal() {
        const modal = document.getElementById('growthLogModal');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        modal.querySelector('.bg-white').classList.add('modal-enter');
        this.updateGrowthUI();
    }

    hideGrowthLogModal() {
        document.getElementById('growthLogModal').classList.add('hidden');
        document.getElementById('growthLogModal').classList.remove('flex');
    }

    updateGrowthUI() {
        // 检查是否首次访问成长树
        if (!this.state.growthData.treeInitialized) {
            this.showTreeInitModal();
        } else {
            this.renderGrowthTree();
        }

        // 更新统计数据
        const stats = document.querySelectorAll('#growthLogModal .grid .text-2xl');
        if (stats.length >= 3) {
            stats[0].textContent = this.state.growthData.conversations || 0;
            stats[1].textContent = this.state.reflectionCards?.length || 0;
            stats[2].textContent = this.state.growthData.actions || 0;
        }
    }
    
    showTreeInitModal() {
        // 创建首次访问成长树的引导模态框
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        
        modal.innerHTML = `
            <div class="bg-white rounded-xl p-6 w-[500px] max-w-90vw">
                <h3 class="text-xl font-medium mb-4 text-center">🌱 种下你的成长树</h3>
                
                <p class="text-gray-600 mb-6">
                    欢迎来到你的成长空间！选择一种树木，开始你的成长之旅。
                    每次对话、复盘和行动完成都会帮助你的树木成长。
                </p>
                
                <div class="grid grid-cols-3 gap-4 mb-6">
                    <label class="flex flex-col items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                        <input type="radio" name="initTreeType" value="oak" checked class="sr-only">
                        <div class="text-4xl mb-2">🌳</div>
                        <div class="font-medium">橡树</div>
                        <div class="text-xs text-gray-500">象征坚韧与力量</div>
                        <div class="w-full h-1 bg-green-100 rounded-full mt-2 tree-select-indicator"></div>
                    </label>
                    
                    <label class="flex flex-col items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                        <input type="radio" name="initTreeType" value="cherry" class="sr-only">
                        <div class="text-4xl mb-2">🌸</div>
                        <div class="font-medium">樱花树</div>
                        <div class="text-xs text-gray-500">象征美丽与转变</div>
                        <div class="w-full h-1 bg-transparent rounded-full mt-2 tree-select-indicator"></div>
                    </label>
                    
                    <label class="flex flex-col items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                        <input type="radio" name="initTreeType" value="bamboo" class="sr-only">
                        <div class="text-4xl mb-2">🎋</div>
                        <div class="font-medium">竹子</div>
                        <div class="text-xs text-gray-500">象征灵活与韧性</div>
                        <div class="w-full h-1 bg-transparent rounded-full mt-2 tree-select-indicator"></div>
                    </label>
                </div>
                
                <div class="flex justify-center">
                    <button id="plantTreeBtn" class="py-2 px-6 bg-warm-blue text-white rounded-full hover:bg-blue-600 transition-colors">
                        种下我的成长树
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 树木选择交互
        const treeOptions = modal.querySelectorAll('input[name="initTreeType"]');
        treeOptions.forEach(option => {
            option.addEventListener('change', (e) => {
                // 更新选择指示器
                modal.querySelectorAll('.tree-select-indicator').forEach(indicator => {
                    indicator.classList.remove('bg-green-100');
                    indicator.classList.add('bg-transparent');
                });
                
                const selectedIndicator = e.target.closest('label').querySelector('.tree-select-indicator');
                selectedIndicator.classList.remove('bg-transparent');
                selectedIndicator.classList.add('bg-green-100');
            });
        });
        
        // 种树按钮
        modal.querySelector('#plantTreeBtn').addEventListener('click', () => {
            const selectedType = modal.querySelector('input[name="initTreeType"]:checked').value;
            this.initializeTree(selectedType);
            document.body.removeChild(modal);
        });
    }
    
    initializeTree(treeType) {
        // 初始化成长树
        this.state.growthData.treeType = treeType;
        this.state.growthData.treeInitialized = true;
        this.state.growthData.plantedDate = new Date().toISOString();
        this.state.growthData.lastWatered = new Date().toISOString();
        this.state.growthData.waterCount = 0;
        this.state.growthData.leafCount = 0;
        this.state.growthData.flowerCount = 0;
        
        // 获取当前季节
        const now = new Date();
        const month = now.getMonth();
        if (month >= 2 && month <= 4) this.state.growthData.season = 'spring';
        else if (month >= 5 && month <= 7) this.state.growthData.season = 'summer';
        else if (month >= 8 && month <= 10) this.state.growthData.season = 'autumn';
        else this.state.growthData.season = 'winter';
        
        this.state.saveToStorage();
        this.renderGrowthTree();
        
        // 显示成功消息
        this.showTreeAnimation('plant');
    }
    
    async renderGrowthTree() {
        const container = document.getElementById('growthTreeTab');
        if (!container) return;
        
        const { level, treeType, season } = this.state.growthData;
        
        // 树木类型
        const treeTypeText = treeType === 'oak' ? '橡树' : (treeType === 'cherry' ? '樱花树' : '竹子');
        
        // 等级描述
        let levelDesc = '';
        if (level <= 1) levelDesc = '幼苗期';
        else if (level <= 3) levelDesc = '成长期';
        else if (level <= 5) levelDesc = '繁茂期';
        else levelDesc = '茁壮期';
        
        // 季节描述
        const seasonText = {
            'spring': '春季',
            'summer': '夏季',
            'autumn': '秋季',
            'winter': '冬季'
        }[season];
        
        // 获取树木图片
        const treeImageContent = await this.getTreeImage(treeType, season, level);
        
        // 检查是否有缓存图片，决定是否显示生成按钮
        const cacheKey = `${treeType}-${season}-${level}`;
        const hasImage = this.treeImageCache && this.treeImageCache[cacheKey];
        
        // 渲染树木
        container.innerHTML = `
            <div class="flex flex-col md:flex-row">
                <div class="w-full md:w-1/2 p-4">
                    <div class="tree-container relative h-80 rounded-xl overflow-hidden ${season}-bg">
                        <div id="treeImage" class="absolute inset-0 flex items-center justify-center">
                            <div class="transform transition-all duration-700 hover:scale-110">
                                ${treeImageContent}
                            </div>
                        </div>
                        <div class="absolute bottom-4 left-4 bg-white bg-opacity-80 rounded-lg px-3 py-1 text-sm">
                            ${seasonText} · ${levelDesc}
                        </div>
                        
                        <!-- 图片生成状态指示器 -->
                        <div id="imageGenerationStatus" class="image-generation-status hidden">
                            <div class="image-generation-spinner"></div>
                            <div class="text-sm font-medium">生成树木图片中...</div>
                        </div>
                    </div>
                    
                    <div class="flex justify-center space-x-4 mt-4">
                        <button id="waterTreeBtn" class="tree-action-btn">
                            💧 浇水
                        </button>
                        <button id="fertilizeTreeBtn" class="tree-action-btn">
                            🌱 施肥
                        </button>
                    </div>
                    
                    <!-- 图片生成按钮 -->
                    <div class="mt-3 mb-4">
                        <button id="generateTreeImageBtn" class="generate-image-btn ${hasImage ? 'opacity-50 cursor-not-allowed' : ''}" ${hasImage ? 'disabled' : ''}>
                            <span class="icon">🖼️</span>
                            <span>${hasImage ? '图片已生成' : '生成树木图片'}</span>
                        </button>
                    </div>
                </div>
                
                <div class="w-full md:w-1/2 p-4">
                    <div class="bg-white rounded-xl p-4 shadow-sm mb-4">
                        <h4 class="font-medium mb-2">你的${treeTypeText}</h4>
                        <div class="text-sm text-gray-600 mb-2">Level ${level} · ${levelDesc}</div>
                        <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div class="h-full bg-warm-blue" style="width: ${(level % 5) * 20}%"></div>
                        </div>
                        <div class="text-xs text-gray-500 mt-1">距离下一级还需 ${5 - (level % 5)} 点成长值</div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div class="bg-white p-4 rounded-lg shadow-sm">
                            <div class="text-sm text-gray-500 mb-1">对话次数</div>
                            <div class="text-xl font-medium">${this.state.growthData.conversations || 0}</div>
                        </div>
                        <div class="bg-white p-4 rounded-lg shadow-sm">
                            <div class="text-sm text-gray-500 mb-1">复盘卡片</div>
                            <div class="text-xl font-medium">${this.state.reflectionCards?.length || 0}</div>
                        </div>
                        <div class="bg-white p-4 rounded-lg shadow-sm">
                            <div class="text-sm text-gray-500 mb-1">行动完成</div>
                            <div class="text-xl font-medium">${this.state.growthData.actions || 0}</div>
                        </div>
                        <div class="bg-white p-4 rounded-lg shadow-sm">
                            <div class="text-sm text-gray-500 mb-1">花朵数量</div>
                            <div class="text-xl font-medium">${this.state.growthData.flowers || 0}</div>
                        </div>
                    </div>
                    
                    <div class="mt-4">
                        <div class="text-sm font-medium mb-2">选择树木类型</div>
                        <div class="flex space-x-4">
                            <label class="flex items-center">
                                <input type="radio" name="treeType" value="oak" ${treeType === 'oak' ? 'checked' : ''} class="mr-2">
                                <span>🌳 橡树</span>
                            </label>
                            <label class="flex items-center">
                                <input type="radio" name="treeType" value="cherry" ${treeType === 'cherry' ? 'checked' : ''} class="mr-2">
                                <span>🌸 樱花树</span>
                            </label>
                            <label class="flex items-center">
                                <input type="radio" name="treeType" value="bamboo" ${treeType === 'bamboo' ? 'checked' : ''} class="mr-2">
                                <span>🎋 竹子</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // 绑定树木交互事件
        this.bindTreeEvents();
    }
    
    bindTreeEvents() {
        // 浇水按钮
        const waterBtn = document.getElementById('waterTreeBtn');
        if (waterBtn) {
            waterBtn.addEventListener('click', () => {
                this.waterTree();
                this.showTreeAnimation('water');
            });
        }
        
        // 施肥按钮
        const fertilizeBtn = document.getElementById('fertilizeTreeBtn');
        if (fertilizeBtn) {
            fertilizeBtn.addEventListener('click', () => {
                this.fertilizeTree();
                this.showTreeAnimation('fertilize');
            });
        }
        
        // 树木类型选择
        document.querySelectorAll('input[name="treeType"]').forEach(input => {
            input.addEventListener('change', (e) => {
                this.changeTreeType(e.target.value);
            });
        });
        
        // 图片生成按钮
        const generateImageBtn = document.getElementById('generateTreeImageBtn');
        if (generateImageBtn) {
            generateImageBtn.addEventListener('click', () => {
                this.generateTreeImageManually();
            });
        }
    }
    
    waterTree() {
        // 检查是否可以浇水（每天限制次数）
        const now = new Date();
        const lastWatered = new Date(this.state.growthData.lastWatered);
        const hoursSinceLastWater = (now - lastWatered) / (1000 * 60 * 60);
        
        if (hoursSinceLastWater < 1) {
            alert('树木刚刚浇过水，请稍后再试');
            return;
        }
        
        // 更新浇水状态
        this.state.growthData.lastWatered = now.toISOString();
        this.state.growthData.waterCount = (this.state.growthData.waterCount || 0) + 1;
        
        // 检查是否升级
        if (this.state.growthData.waterCount % 3 === 0) {
            this.state.growthData.level++;
            this.showLevelUpAnimation();
        }
        
        this.state.saveToStorage();
        this.renderGrowthTree();
    }
    
    fertilizeTree() {
        // 检查是否可以施肥（需要有足够的复盘卡片）
        const cardsCount = this.state.reflectionCards?.length || 0;
        const fertilizeCount = this.state.growthData.fertilizeCount || 0;
        
        if (cardsCount <= fertilizeCount * 2) {
            alert('需要更多的复盘卡片才能施肥');
            return;
        }
        
        // 更新施肥状态
        this.state.growthData.fertilizeCount = fertilizeCount + 1;
        
        // 增加花朵
        this.state.growthData.flowers = (this.state.growthData.flowers || 0) + 1;
        
        // 检查是否升级
        if (this.state.growthData.fertilizeCount % 2 === 0) {
            this.state.growthData.level++;
            this.showLevelUpAnimation();
        }
        
        this.state.saveToStorage();
        this.renderGrowthTree();
    }
    
    showTreeAnimation(type) {
        const treeImage = document.getElementById('treeImage');
        if (!treeImage) return;
        
        switch (type) {
            case 'plant':
                // 种树动画
                treeImage.classList.add('animate-bounce');
                setTimeout(() => {
                    treeImage.classList.remove('animate-bounce');
                }, 1000);
                break;
                
            case 'water':
                // 浇水动画
                const waterDrop = document.createElement('div');
                waterDrop.className = 'absolute text-3xl animate-water-drop';
                waterDrop.textContent = '💧';
                waterDrop.style.left = '50%';
                waterDrop.style.top = '10%';
                treeImage.appendChild(waterDrop);
                
                setTimeout(() => {
                    treeImage.removeChild(waterDrop);
                }, 1000);
                break;
                
            case 'fertilize':
                // 施肥动画
                const fertilizer = document.createElement('div');
                fertilizer.className = 'absolute text-3xl animate-fertilize';
                fertilizer.textContent = '✨';
                fertilizer.style.left = '50%';
                fertilizer.style.top = '50%';
                treeImage.appendChild(fertilizer);
                
                setTimeout(() => {
                    treeImage.removeChild(fertilizer);
                }, 1000);
                break;
        }
    }
    
    showLevelUpAnimation() {
        // 等级提升动画
        const container = document.querySelector('.tree-container');
        if (!container) return;
        
        const levelUp = document.createElement('div');
        levelUp.className = 'absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 animate-fade-in';
        levelUp.innerHTML = `
            <div class="bg-white rounded-lg px-6 py-4 text-center animate-scale-in">
                <div class="text-3xl mb-2">🎉</div>
                <div class="text-xl font-bold mb-1">等级提升!</div>
                <div class="text-sm">你的成长树升到了 Level ${this.state.growthData.level}</div>
            </div>
        `;
        
        container.appendChild(levelUp);
        
        setTimeout(() => {
            container.removeChild(levelUp);
        }, 2000);
    }
    
    changeTreeType(type) {
        this.state.growthData.treeType = type;
        this.state.saveToStorage();
        this.renderGrowthTree();
    }
    
    async getTreeImage(type, season, level) {
        // 检查缓存中是否已有图片
        const cacheKey = `${type}-${season}-${level}`;
        if (this.treeImageCache && this.treeImageCache[cacheKey]) {
            return `<img src="${this.treeImageCache[cacheKey]}" alt="成长树" class="max-h-64 rounded-lg">`;
        }
        
        // 如果没有缓存图片，返回emoji作为占位符
        return this.getTreeEmoji(type, season, level);
    }
    
    getTreeEmoji(type, season, level) {
        // 根据树木类型、季节和等级返回对应的表情符号
        if (type === 'oak') {
            if (level <= 1) return '🌱';
            if (level <= 3) return '🌿';
            if (level <= 5) return '🌱🌿';
            if (level <= 8) return season === 'autumn' ? '🍂' : '🌳';
            return season === 'autumn' ? '🍁🌳' : '🌳';
        } else if (type === 'cherry') {
            if (level <= 1) return '🌱';
            if (level <= 3) return '🌿';
            if (level <= 5) return '🌱🌿';
            if (level <= 8) return season === 'spring' ? '🌸' : '🌳';
            return season === 'spring' ? '🌸🌸' : '🌳';
        } else { // bamboo
            if (level <= 1) return '🌱';
            if (level <= 3) return '🎍';
            if (level <= 5) return '🌱🎍';
            if (level <= 8) return '🎋';
            return '🎋🎋';
        }
    }
    
    async generateTreeImageManually() {
        // 获取当前树木状态
        const { treeType, season, level } = this.state.growthData;
        const cacheKey = `${treeType}-${season}-${level}`;
        
        // 检查是否已有缓存图片
        if (this.treeImageCache && this.treeImageCache[cacheKey]) {
            alert('当前树木图片已存在，无需重新生成');
            return;
        }
        
        // 显示生成状态
        const statusElement = document.getElementById('imageGenerationStatus');
        if (statusElement) {
            statusElement.classList.remove('hidden');
        }
        
        try {
            // 生成提示词
            const prompt = this.generateTreePrompt(treeType, season, level);
            
            // 调用通义万象生成图片
            const imageUrl = await this.generateTreeImageWithWanxiang(prompt, cacheKey);
            
            // 缓存图片URL
            if (!this.treeImageCache) {
                this.treeImageCache = {};
            }
            this.treeImageCache[cacheKey] = imageUrl;
            
            // 保存到本地存储
            if (!this.state.treeImages) {
                this.state.treeImages = {};
            }
            this.state.treeImages[cacheKey] = imageUrl;
            this.state.saveToStorage();
            
            // 更新树木显示
            this.renderGrowthTree();
            
            // 隐藏生成状态
            if (statusElement) {
                statusElement.classList.add('hidden');
            }
            
            alert('树木图片生成成功！');
        } catch (error) {
            console.error('生成树木图片失败:', error);
            
            // 隐藏生成状态
            if (statusElement) {
                statusElement.classList.add('hidden');
            }
            
            alert(`生成树木图片失败: ${error.message || '未知错误'}`);
        }
    }
    
    generateTreePrompt(type, season, level) {
        // 根据树木类型、季节和等级生成提示词
        let basePrompt = '';
        let stageDesc = '';
        
        // 树木类型描述
        if (type === 'oak') {
            basePrompt = '一棵橡树';
        } else if (type === 'cherry') {
            basePrompt = '一棵樱花树';
        } else { // bamboo
            basePrompt = '一棵竹子';
        }
        
        // 成长阶段描述
        if (level <= 1) {
            stageDesc = '刚刚发芽的幼苗';
        } else if (level <= 3) {
            stageDesc = '小小的幼苗，有几片嫩叶';
        } else if (level <= 5) {
            stageDesc = '成长中的小树，有一些枝叶';
        } else if (level <= 8) {
            stageDesc = '茁壮成长的树，枝繁叶茂';
        } else {
            stageDesc = '高大茂盛的成熟树，非常壮观';
        }
        
        // 季节描述
        let seasonDesc = '';
        switch (season) {
            case 'spring':
                seasonDesc = '春天，背景有嫩绿的草地和蓝天';
                break;
            case 'summer':
                seasonDesc = '夏天，阳光明媚，树叶翠绿';
                break;
            case 'autumn':
                seasonDesc = '秋天，树叶变黄或红色，有落叶';
                break;
            case 'winter':
                seasonDesc = '冬天，可能有雪，树木安静';
                break;
        }
        
        // 特殊效果
        let specialEffect = '';
        if (type === 'cherry' && season === 'spring' && level >= 5) {
            specialEffect = '，盛开的粉色花朵';
        } else if (type === 'oak' && season === 'autumn' && level >= 5) {
            specialEffect = '，金黄色的橡树叶';
        }
        
        // 组合提示词
        return `${basePrompt}，${stageDesc}${specialEffect}，${seasonDesc}，高清写实风格，温暖柔和的光线，自然场景`;
    }
    
    async generateTreeImageWithWanxiang(prompt, cacheKey) {
        const { apiKey } = this.state.config;
        
        if (!apiKey) {
            throw new Error('未设置API Key');
        }
        
        // 步骤1：提交图片生成任务
        const taskResponse = await fetch('http://localhost:3000/api/dashscope/api/v1/services/aigc/text2image/image-synthesis', {
            method: 'POST',
            headers: {
                'X-DashScope-Async': 'enable',
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'wan2.2-t2i-flash',
                input: {
                    prompt: prompt
                },
                parameters: {
                    size: '1024*1024',
                    n: 1
                }
            })
        });
        
        if (!taskResponse.ok) {
            throw new Error(`提交图片生成任务失败: ${taskResponse.status}`);
        }
        
        const taskData = await taskResponse.json();
        const taskId = taskData.output.task_id;
        
        // 步骤2：轮询获取结果
        let imageUrl = null;
        let retries = 0;
        const maxRetries = 10;
        
        while (retries < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // 等待2秒
            
        const resultResponse = await fetch(`http://localhost:3000/api/dashscope/api/v1/tasks/${taskId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });
            
            if (!resultResponse.ok) {
                retries++;
                continue;
            }
            
            const resultData = await resultResponse.json();
            
            if (resultData.output.task_status === 'SUCCEEDED') {
                imageUrl = resultData.output.results[0].url;
                break;
            } else if (resultData.output.task_status === 'FAILED') {
                throw new Error(`图片生成失败: ${resultData.output.message || '未知错误'}`);
            }
            
            retries++;
        }
        
        if (!imageUrl) {
            throw new Error('图片生成超时');
        }
        
        return imageUrl;
    }

    hideAllModals() {
        this.hideNewRoundtableModal();
        this.hideConfigModal();
        this.hideGrowthLogModal();
        this.hideReflectModal();
    }
    
    // 复盘功能相关方法
    showReflectModal(type) {
        if (!this.state.currentSession || this.state.currentSession.messages.length < 2) {
            alert('需要有足够的对话内容才能进行复盘');
            return;
        }
        
        const modal = document.getElementById('reflectModal');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        modal.querySelector('.bg-white').classList.add('modal-enter');
        
        // 设置复盘类型
        this.reflectType = type;
        
        if (type === 'quick') {
            document.getElementById('reflectModalTitle').textContent = '闪电复盘';
            document.getElementById('quickReflectContent').style.display = 'block';
            document.getElementById('deepReflectContent').style.display = 'none';
            document.getElementById('reflectResult').style.display = 'none';
            document.getElementById('createReflectCard').textContent = '生成复盘卡片';
        } else {
            document.getElementById('reflectModalTitle').textContent = '深潜复盘';
            document.getElementById('quickReflectContent').style.display = 'none';
            document.getElementById('deepReflectContent').style.display = 'block';
            document.getElementById('reflectResult').style.display = 'none';
            document.getElementById('createReflectCard').textContent = '开始引导';
            
            // 生成引导问题
            this.generateGuidingQuestions();
        }
    }
    
    hideReflectModal() {
        document.getElementById('reflectModal').classList.add('hidden');
        document.getElementById('reflectModal').classList.remove('flex');
    }
    
    async generateGuidingQuestions() {
        try {
            const { aiProvider, apiKey, textModel } = this.state.config;
            
            // 获取最近的对话内容
            const recentMessages = this.state.currentSession.messages.slice(-10);
            const dialogueContent = recentMessages.map(msg => 
                `${msg.role === 'user' ? '用户' : AI_ROLES[msg.aiRole].name}: ${msg.content}`
            ).join('\n');
            
            // 构建提示
            const prompt = [
                {
                    role: 'system',
                    content: '你是一位专业的复盘引导师，擅长帮助用户进行深度反思。请根据用户的对话内容，生成3个引导性问题，帮助用户进行深度复盘。问题应该有深度、启发性，并且针对用户对话中的关键点。返回格式为JSON数组，每个问题包含id和question两个字段。'
                },
                {
                    role: 'user',
                    content: `以下是用户的对话内容，请生成引导性问题：\n\n${dialogueContent}`
                }
            ];
            
            // 调用AI
            let response;
            if (aiProvider === 'dashscope') {
                response = await this.callDashScope(prompt, textModel, apiKey);
            } else {
                response = await this.callOpenRouter(prompt, textModel, apiKey);
            }
            
            // 解析返回的JSON
            let questions;
            try {
                // 尝试提取JSON部分
                const jsonMatch = response.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    questions = JSON.parse(jsonMatch[0]);
                } else {
                    throw new Error('无法解析JSON');
                }
            } catch (e) {
                // 如果解析失败，使用默认问题
                questions = [
                    { id: 1, question: "这次对话中，你最大的收获或启发是什么？" },
                    { id: 2, question: "你注意到自己有哪些思维模式或情绪反应？" },
                    { id: 3, question: "如果可以重来，你会如何调整自己的表达或行动？" }
                ];
            }
            
            // 保存问题并显示第一个
            this.reflectQuestions = questions;
            this.currentQuestionIndex = 0;
            this.showCurrentQuestion();
            
        } catch (error) {
            console.error('生成引导问题失败:', error);
            
            // 使用默认问题
            this.reflectQuestions = [
                { id: 1, question: "这次对话中，你最大的收获或启发是什么？" },
                { id: 2, question: "你注意到自己有哪些思维模式或情绪反应？" },
                { id: 3, question: "如果可以重来，你会如何调整自己的表达或行动？" }
            ];
            this.currentQuestionIndex = 0;
            this.showCurrentQuestion();
        }
    }
    
    showCurrentQuestion() {
        const question = this.reflectQuestions[this.currentQuestionIndex];
        const questionText = document.querySelector('.reflect-question-text');
        const answerInput = document.getElementById('deepReflectAnswer');
        const prevButton = document.getElementById('prevQuestion');
        const nextButton = document.getElementById('nextQuestion');
        const progress = document.getElementById('questionProgress');
        
        // 设置问题文本
        questionText.textContent = question.question;
        
        // 设置答案（如果已有）
        if (this.reflectAnswers && this.reflectAnswers[question.id]) {
            answerInput.value = this.reflectAnswers[question.id];
        } else {
            answerInput.value = '';
        }
        
        // 更新按钮状态
        prevButton.disabled = this.currentQuestionIndex === 0;
        
        if (this.currentQuestionIndex === this.reflectQuestions.length - 1) {
            nextButton.textContent = '完成';
            document.getElementById('createReflectCard').style.display = 'block';
        } else {
            nextButton.textContent = '下一题';
            document.getElementById('createReflectCard').style.display = 'none';
        }
        
        // 更新进度
        progress.textContent = `问题 ${this.currentQuestionIndex + 1}/${this.reflectQuestions.length}`;
    }
    
    saveCurrentAnswer() {
        const question = this.reflectQuestions[this.currentQuestionIndex];
        const answerInput = document.getElementById('deepReflectAnswer');
        
        if (!this.reflectAnswers) {
            this.reflectAnswers = {};
        }
        
        this.reflectAnswers[question.id] = answerInput.value.trim();
    }
    
    async createReflectionCard() {
        try {
            if (this.reflectType === 'quick') {
                await this.createQuickReflectionCard();
            } else {
                await this.createDeepReflectionCard();
            }
        } catch (error) {
            console.error('创建复盘卡片失败:', error);
            alert('创建复盘卡片失败，请重试');
        }
    }
    
    async createQuickReflectionCard() {
        const { aiProvider, apiKey, textModel } = this.state.config;
        
        // 检查是否已经生成了卡片，避免重复生成
        if (this.isCardGenerating) return;
        this.isCardGenerating = true;
        
        // 获取选中的标签
        const selectedTags = Array.from(document.querySelectorAll('input[name="reflectTag"]:checked'))
            .map(input => input.value);
            
        // 获取最近的对话内容
        const recentMessages = this.state.currentSession.messages.slice(-10);
        const dialogueContent = recentMessages.map(msg => 
            `${msg.role === 'user' ? '用户' : AI_ROLES[msg.aiRole].name}: ${msg.content}`
        ).join('\n');
        
        // 显示加载状态
        document.getElementById('reflectResult').style.display = 'block';
        document.getElementById('reflectResult').innerHTML = '<div class="text-center py-4"><div class="inline-block animate-pulse">✨ 生成复盘卡片中...</div></div>';
        document.getElementById('createReflectCard').disabled = true;
        
        // 构建提示
        const prompt = [
            {
                role: 'system',
                content: '你是一位专业的复盘助手，擅长总结对话并提取关键洞察。请根据用户的对话内容，生成一张温暖、鼓励的复盘卡片，包含以下部分：1. 标题（简洁有力）；2. 核心洞察（1-2句话）；3. 关键点（3点）；4. 行动建议（1-2点）。格式要简洁清晰，语言温暖鼓励，适合卡片展示。'
            },
            {
                role: 'user',
                content: `以下是用户的对话内容，请生成温暖、鼓励的复盘卡片：\n\n${dialogueContent}\n\n用户选择的标签：${selectedTags.join(', ')}`
            }
        ];
        
        // 调用AI
        let response;
        try {
            if (aiProvider === 'dashscope') {
                response = await this.callDashScope(prompt, textModel, apiKey);
            } else {
                response = await this.callOpenRouter(prompt, textModel, apiKey);
            }
            
            // 显示结果，使用马卡龙风格
            document.getElementById('reflectResult').innerHTML = `
                <div class="macaron-title">闪电复盘卡片</div>
                <div class="macaron-content whitespace-pre-line overflow-y-auto max-h-60">${response}</div>
            `;
            
            // 保存复盘卡片
            const card = {
                type: 'quick',
                title: this.state.currentSession.title,
                content: response,
                tags: selectedTags.length > 0 ? selectedTags : ['复盘'],
                sessionId: this.state.currentSession.id,
                createdAt: new Date().toISOString()
            };
            
            if (!this.state.reflectionCards) {
                this.state.reflectionCards = [];
            }
            this.state.reflectionCards.unshift(card);
            this.state.saveToStorage();
            this.state.updateGrowthData('card');
            
            // 更新按钮状态
            document.getElementById('createReflectCard').disabled = false;
            document.getElementById('createReflectCard').textContent = '完成';
            document.getElementById('createReflectCard').addEventListener('click', () => {
                this.hideReflectModal();
                this.isCardGenerating = false; // 重置标志
            }, { once: true });
            
        } catch (error) {
            console.error('生成复盘卡片失败:', error);
            document.getElementById('reflectResult').innerHTML = `
                <div class="text-red-500 text-center py-4">
                    生成复盘卡片失败，请重试
                </div>
            `;
            document.getElementById('createReflectCard').disabled = false;
            this.isCardGenerating = false; // 重置标志
        }
    }
    
    async createDeepReflectionCard() {
        const { aiProvider, apiKey, textModel } = this.state.config;
        
        // 检查是否已经生成了卡片，避免重复生成
        if (this.isCardGenerating) return;
        this.isCardGenerating = true;
        
        // 保存最后一个问题的答案
        this.saveCurrentAnswer();
        
        // 检查是否有回答
        const hasAnswers = Object.values(this.reflectAnswers).some(answer => answer.length > 0);
        if (!hasAnswers) {
            alert('请至少回答一个问题');
            this.isCardGenerating = false;
            return;
        }
        
        // 显示加载状态
        document.getElementById('deepReflectContent').style.display = 'none';
        document.getElementById('reflectResult').style.display = 'block';
        document.getElementById('reflectResult').innerHTML = '<div class="text-center py-4"><div class="inline-block animate-pulse">🧠 生成复盘卡片中...</div></div>';
        document.getElementById('createReflectCard').disabled = true;
        
        // 获取最近的对话内容
        const recentMessages = this.state.currentSession.messages.slice(-10);
        const dialogueContent = recentMessages.map(msg => 
            `${msg.role === 'user' ? '用户' : AI_ROLES[msg.aiRole].name}: ${msg.content}`
        ).join('\n');
        
        // 构建问题和回答的格式化文本
        const questionsAndAnswers = this.reflectQuestions.map(q => {
            const answer = this.reflectAnswers[q.id] || '(未回答)';
            return `问题：${q.question}\n回答：${answer}`;
        }).join('\n\n');
        
        // 构建提示
        const prompt = [
            {
                role: 'system',
                content: '你是一位专业的复盘助手，擅长整合用户的反思并提供深度洞察。请根据用户的对话内容和回答的问题，生成一张温暖、鼓励的深度复盘卡片，包含以下部分：1. 标题（反映核心主题）；2. 深度洞察（2-3句话）；3. 思维模式分析（简洁1段）；4. 成长方向（2点）；5. 行动计划（具体可执行的1-2个步骤）。格式要清晰有条理，语言温暖鼓励。'
            },
            {
                role: 'user',
                content: `对话内容：\n${dialogueContent}\n\n用户的反思回答：\n${questionsAndAnswers}\n\n请生成温暖、鼓励的深度复盘卡片。`
            }
        ];
        
        // 调用AI
        let response;
        try {
            if (aiProvider === 'dashscope') {
                response = await this.callDashScope(prompt, textModel, apiKey);
            } else {
                response = await this.callOpenRouter(prompt, textModel, apiKey);
            }
            
            // 显示结果，使用马卡龙风格，添加滚动功能
            document.getElementById('reflectResult').innerHTML = `
                <div class="macaron-title">深度复盘卡片</div>
                <div class="macaron-content whitespace-pre-line overflow-y-auto max-h-60">${response}</div>
            `;
            
            // 保存复盘卡片
            const card = {
                type: 'deep',
                title: this.state.currentSession.title,
                content: response,
                tags: ['深度复盘'],
                sessionId: this.state.currentSession.id,
                createdAt: new Date().toISOString(),
                userAnswers: this.reflectAnswers
            };
            
            if (!this.state.reflectionCards) {
                this.state.reflectionCards = [];
            }
            this.state.reflectionCards.unshift(card);
            this.state.saveToStorage();
            this.state.updateGrowthData('card');
            
            // 更新按钮状态
            document.getElementById('createReflectCard').disabled = false;
            document.getElementById('createReflectCard').textContent = '完成';
            document.getElementById('createReflectCard').addEventListener('click', () => {
                this.hideReflectModal();
                this.isCardGenerating = false; // 重置标志
            }, { once: true });
            
        } catch (error) {
            console.error('生成复盘卡片失败:', error);
            document.getElementById('reflectResult').innerHTML = `
                <div class="text-red-500 text-center py-4">
                    生成复盘卡片失败，请重试
                </div>
            `;
            document.getElementById('createReflectCard').disabled = false;
            this.isCardGenerating = false; // 重置标志
        }
    }
    
    // 成长日志系统相关方法
    switchGrowthTab(tabId) {
        // 更新标签状态
        document.querySelectorAll('.growth-tab-macaron').forEach(tab => {
            if (tab.dataset.target === tabId) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        
        // 显示对应内容
        document.querySelectorAll('.growth-content').forEach(content => {
            content.classList.add('hidden');
        });
        document.getElementById(`${tabId}Tab`).classList.remove('hidden');
        
        // 根据标签加载内容
        switch (tabId) {
            case 'cardArchive':
                this.renderCardArchive();
                break;
            case 'growthDashboard':
                this.renderGrowthDashboard();
                break;
            case 'monthlyReport':
                this.renderMonthlyReport();
                break;
        }
    }
    
    changeTreeType(type) {
        // 检查当前树木是否已经完全成长
        const currentLevel = this.state.growthData.level;
        const isFullyGrown = currentLevel >= 5 && (currentLevel % 5) === 0;
        
        // 如果树木未完全成长，不允许更换类型
        if (!isFullyGrown && this.state.growthData.treeInitialized) {
            alert('当前树木尚未完全成长（需要达到5级、10级、15级等），请继续培养当前树木');
            return;
        }
        
        // 如果树木已完全成长，将其添加到成长森林
        if (isFullyGrown && this.state.growthData.treeInitialized) {
            this.addTreeToForest();
        }
        
        // 更新树木类型
        this.state.growthData.treeType = type;
        this.state.saveToStorage();
        this.updateGrowthUI();
        
        // 清除树木图片缓存，以便重新生成
        this.treeImageCache = {};
    }
    
    addTreeToForest() {
        // 将当前树木添加到成长森林
        if (!this.state.growthData.forest) {
            this.state.growthData.forest = [];
        }
        
        // 创建树木记录
        const tree = {
            id: Date.now().toString(),
            type: this.state.growthData.treeType,
            level: this.state.growthData.level,
            plantedDate: this.state.growthData.plantedDate,
            completedDate: new Date().toISOString(),
            season: this.state.growthData.season,
            imageUrl: this.treeImageCache[`${this.state.growthData.treeType}-${this.state.growthData.season}-${this.state.growthData.level}`]
        };
        
        this.state.growthData.forest.push(tree);
        this.state.saveToStorage();
        
        // 显示成就
        this.state.addAchievement('forest_first', '森林守护者', '你的第一棵树已完全成长，并加入了成长森林！');
        
        // 显示提示
        alert('恭喜！你的树木已完全成长，并已加入成长森林。你可以开始培养新的树木了！');
    }
    
    renderCardArchive() {
        const container = document.getElementById('cardArchive');
        const timeFilter = document.getElementById('cardTimeFilter').value;
        const tagFilter = document.getElementById('cardTagFilter').value;
        
        // 筛选卡片
        let filteredCards = this.state.reflectionCards || [];
        
        // 时间筛选
        if (timeFilter !== 'all') {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            
            switch (timeFilter) {
                case 'day':
                    filteredCards = filteredCards.filter(card => {
                        const cardDate = new Date(card.createdAt);
                        return cardDate >= today;
                    });
                    break;
                case 'week':
                    const weekStart = new Date(today);
                    weekStart.setDate(today.getDate() - today.getDay());
                    filteredCards = filteredCards.filter(card => {
                        const cardDate = new Date(card.createdAt);
                        return cardDate >= weekStart;
                    });
                    break;
                case 'month':
                    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                    filteredCards = filteredCards.filter(card => {
                        const cardDate = new Date(card.createdAt);
                        return cardDate >= monthStart;
                    });
                    break;
            }
        }
        
        // 标签筛选
        if (tagFilter !== 'all') {
            filteredCards = filteredCards.filter(card => 
                card.tags && card.tags.includes(tagFilter)
            );
        }
        
        // 渲染卡片
        if (filteredCards.length === 0) {
            container.innerHTML = `
                <div class="text-center text-gray-500 py-10 col-span-2 bg-white rounded-lg shadow-sm">
                    <div class="text-4xl mb-3">📌</div>
                    <div class="text-lg mb-1">暂无符合条件的复盘卡片</div>
                    <div class="text-sm text-gray-400">尝试调整筛选条件或创建新的复盘卡片</div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = '';
        
        // 为不同类型的卡片分配不同的马卡龙颜色
        const cardColors = ['pink', 'blue', 'green', 'purple', 'orange', 'yellow'];
        
        filteredCards.forEach((card, index) => {
            // 循环使用颜色
            const colorIndex = index % cardColors.length;
            const cardColor = cardColors[colorIndex];
            
            const cardElement = document.createElement('div');
            cardElement.className = `macaron-card ${cardColor} hover:shadow-lg transition-all`;
            
            // 提取标题
            let title = card.title;
            let content = card.content;
            
            // 尝试从内容中提取标题
            const titleMatch = card.content.match(/^#*\s*(.*?)[\n\r]/);
            if (titleMatch) {
                title = titleMatch[1];
                content = card.content.replace(titleMatch[0], '');
            }
            
            // 截断内容
            const shortContent = content.length > 100 ? content.substring(0, 100) + '...' : content;
            
            cardElement.innerHTML = `
                <div class="flex justify-between items-start mb-3">
                    <h5 class="font-medium text-gray-800">${title}</h5>
                    <span class="text-xs text-gray-600">${new Date(card.createdAt).toLocaleDateString()}</span>
                </div>
                <div class="text-sm text-gray-700 mb-4 whitespace-pre-line">${shortContent}</div>
                <div class="flex flex-wrap gap-2">
                    ${card.tags.map(tag => `
                        <span class="macaron-tag ${cardColor} text-xs">#${tag}</span>
                    `).join('')}
                    <span class="macaron-tag ${card.type === 'deep' ? 'purple' : 'orange'} text-xs ml-auto">
                        ${card.type === 'deep' ? '深潜' : '闪电'}复盘
                    </span>
                </div>
            `;
            
            // 点击查看详情
            cardElement.addEventListener('click', () => {
                this.showCardDetail(card);
            });
            
            container.appendChild(cardElement);
        });
    }
    
    showCardDetail(card) {
        // 确定卡片颜色
        const cardColor = card.type === 'deep' ? 'purple' : 'orange';
        
        // 创建模态框
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        
        modal.innerHTML = `
            <div class="macaron-card ${cardColor} w-[600px] max-w-90vw max-h-[80vh] overflow-y-auto">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-medium text-gray-800">${card.title}</h3>
                    <span class="text-sm text-gray-600">${new Date(card.createdAt).toLocaleDateString()}</span>
                </div>
                
                <div class="whitespace-pre-line mb-6 text-gray-700">${card.content}</div>
                
                <div class="flex flex-wrap gap-2 mb-6">
                    ${card.tags.map(tag => `
                        <span class="macaron-tag ${cardColor} text-xs">#${tag}</span>
                    `).join('')}
                </div>
                
                <div class="flex justify-end">
                    <button class="close-card-detail py-2 px-6 bg-white bg-opacity-70 text-gray-700 rounded-full hover:bg-white hover:shadow-md transition-all">
                        关闭
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 添加动画效果
        setTimeout(() => {
            modal.querySelector('.macaron-card').classList.add('modal-enter');
        }, 10);
        
        // 关闭按钮
        modal.querySelector('.close-card-detail').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        // 点击外部关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }
    
    renderGrowthDashboard() {
        // 如果没有足够的数据，显示默认内容
        if (this.state.reflectionCards.length < 3) return;
        
        // 模拟数据可视化
        // 在实际应用中，这里应该使用Chart.js或其他图表库
        
        // 高频挑战
        document.getElementById('challengesList').innerHTML = `
            <ul class="text-left">
                <li class="mb-2">• 你在"向上沟通"上纠结了${Math.floor(Math.random() * 10) + 3}次</li>
                <li class="mb-2">• "团队协作"是你第二高频的挑战</li>
                <li>• "时间管理"问题出现了${Math.floor(Math.random() * 5) + 2}次</li>
            </ul>
        `;
        
        // 情绪模式
        document.getElementById('emotionPatterns').innerHTML = `
            <ul class="text-left">
                <li class="mb-2">• ${Math.floor(Math.random() * 30) + 60}%的低落情绪发生在周一上午</li>
                <li class="mb-2">• 周四是你情绪最稳定的一天</li>
                <li>• 与上月相比，积极情绪增加了${Math.floor(Math.random() * 15) + 5}%</li>
            </ul>
        `;
        
        // 进步对比
        document.getElementById('progressComparison').innerHTML = `
            <ul class="text-left">
                <li class="mb-2">• 3个月前你说"我不行"，现在你说"我可以调整"</li>
                <li class="mb-2">• 你的解决方案更加具体和可行</li>
                <li>• 你开始主动寻求反馈，而不是回避</li>
            </ul>
        `;
        
        // 行动力
        document.getElementById('actionPower').innerHTML = `
            <ul class="text-left">
                <li class="mb-2">• 本月行动完成率${Math.floor(Math.random() * 20) + 70}%</li>
                <li class="mb-2">• 超过${Math.floor(Math.random() * 15) + 75}%的用户</li>
                <li>• 相比上月提升了${Math.floor(Math.random() * 10) + 5}%</li>
            </ul>
        `;
    }
    
    renderMonthlyReport() {
        const reportSelector = document.getElementById('monthSelector');
        const reportContent = document.getElementById('monthlyReportContent');
        const exportBtn = document.getElementById('exportReportBtn');
        
        // 检查是否有月报
        if (this.state.monthlyReports.length === 0) {
            return;
        }
        
        // 启用导出按钮
        exportBtn.disabled = false;
        exportBtn.classList.remove('bg-gray-100', 'text-gray-700');
        exportBtn.classList.add('bg-warm-blue', 'text-white', 'hover:bg-blue-600');
        
        // 获取选中的月报
        const selectedValue = reportSelector.value;
        let report;
        
        if (selectedValue === 'current') {
            report = this.state.monthlyReports[0];
        } else {
            report = this.state.monthlyReports[1] || this.state.monthlyReports[0];
        }
        
        // 渲染月报
        reportContent.innerHTML = `
            <div class="text-center mb-6">
                <h3 class="text-2xl font-bold mb-1">📄 你的${report.monthName}成长报告</h3>
                <p class="text-gray-500">生成于 ${new Date(report.createdAt).toLocaleDateString()}</p>
            </div>
            
            <div class="space-y-4">
                <div class="flex items-center border-b border-gray-100 pb-3">
                    <div class="text-3xl mr-4">🌱</div>
                    <div>
                        <div class="font-medium">成长树状态：Level ${report.treeLevel} · ${report.treeStage}</div>
                    </div>
                </div>
                
                <div class="flex items-center border-b border-gray-100 pb-3">
                    <div class="text-3xl mr-4">📈</div>
                    <div>
                        <div class="font-medium">行动力：完成了${report.actionCompletion.completed}/${report.actionCompletion.total}个计划</div>
                        <div class="text-sm text-gray-500">+${Math.floor(Math.random() * 20) + 5}% vs 上月</div>
                    </div>
                </div>
                
                <div class="flex items-center border-b border-gray-100 pb-3">
                    <div class="text-3xl mr-4">💬</div>
                    <div>
                        <div class="font-medium">最常说的一句话："${report.commonPhrases}"</div>
                    </div>
                </div>
                
                <div class="flex items-center border-b border-gray-100 pb-3">
                    <div class="text-3xl mr-4">🎯</div>
                    <div>
                        <div class="font-medium">突破时刻：${report.breakthroughMoment}</div>
                    </div>
                </div>
                
                <div class="flex items-center border-b border-gray-100 pb-3">
                    <div class="text-3xl mr-4">🧠</div>
                    <div>
                        <div class="font-medium">认知升级提醒：${report.cognitiveUpgrade}</div>
                    </div>
                </div>
                
                <div class="flex items-center border-b border-gray-100 pb-3">
                    <div class="text-3xl mr-4">🌸</div>
                    <div>
                        <div class="font-medium">本月花开：${report.flowers}朵</div>
                    </div>
                </div>
                
                ${report.achievements.length > 0 ? `
                    <div class="flex items-center border-b border-gray-100 pb-3">
                        <div class="text-3xl mr-4">🎁</div>
                        <div>
                            <div class="font-medium">解锁成就：${report.achievements.map(a => `【${a.title}】${a.description}`).join('，')}</div>
                        </div>
                    </div>
                ` : ''}
                
                <div class="flex items-center">
                    <div class="text-3xl mr-4">✨</div>
                    <div>
                        <div class="font-medium">特别提示：你的情绪恢复速度比上月快了${report.emotionalRecovery}%</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    filterCards() {
        this.renderCardArchive();
    }

    renderSessions() {
        const sessionList = document.getElementById('sessionList');
        sessionList.innerHTML = '';

        this.state.sessions.forEach(session => {
            const sessionElement = document.createElement('div');
            sessionElement.className = `session-item ${session === this.state.currentSession ? 'active' : ''}`;
            
            const lastMessage = session.messages[session.messages.length - 1];
            const preview = lastMessage ? 
                (lastMessage.role === 'user' ? lastMessage.content : `${lastMessage.aiRole}: ${lastMessage.content}`) : 
                '新建的圆桌对话';

            sessionElement.innerHTML = `
                <div class="session-title">${session.title}</div>
                <div class="session-preview">${preview.substring(0, 30)}${preview.length > 30 ? '...' : ''}</div>
            `;

            sessionElement.addEventListener('click', () => {
                this.switchToSession(session);
            });

            sessionList.appendChild(sessionElement);
        });
    }

    switchToSession(session) {
        this.state.currentSession = session;
        this.renderSessions();
        this.renderChat();
        this.showChatInterface();
    }

    showChatInterface() {
        document.getElementById('aiRoleBar').classList.remove('hidden');
        document.getElementById('inputArea').style.display = 'block';
        this.renderAIRoles();
    }

    renderAIRoles() {
        const aiRolesContainer = document.getElementById('aiRoles');
        aiRolesContainer.innerHTML = '';

        if (!this.state.currentSession) return;

        this.state.currentSession.aiRoles.forEach(roleKey => {
            const role = AI_ROLES[roleKey];
            const roleElement = document.createElement('div');
            roleElement.className = 'ai-avatar inactive';
            roleElement.style.backgroundColor = role.color + '20';
            roleElement.style.border = `2px solid ${role.color}`;
            roleElement.innerHTML = role.emoji;
            roleElement.title = role.name;

            aiRolesContainer.appendChild(roleElement);
        });
    }

    renderChat() {
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = '';

        if (!this.state.currentSession || this.state.currentSession.messages.length === 0) {
            chatMessages.innerHTML = `
                <div class="max-w-4xl mx-auto">
                    <div class="text-center text-gray-500 py-20">
                        <div class="text-6xl mb-4">💬</div>
                        <h2 class="text-2xl font-medium mb-2">开始您的成长对话</h2>
                        <p class="text-gray-400">分享您的想法，让AI伙伴们帮助您思考</p>
                    </div>
                </div>
            `;
            return;
        }

        const messagesContainer = document.createElement('div');
        messagesContainer.className = 'max-w-4xl mx-auto space-y-4';

        this.state.currentSession.messages.forEach(message => {
            const messageElement = this.createMessageElement(message);
            messagesContainer.appendChild(messageElement);
        });

        chatMessages.appendChild(messagesContainer);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    createMessageElement(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.role === 'user' ? 'user-message' : 'ai-message'}`;

        if (message.role === 'user') {
            messageDiv.innerHTML = `
                <div class="message-content">${message.content}</div>
            `;
        } else {
            const role = AI_ROLES[message.aiRole];
            messageDiv.innerHTML = `
                <div class="message-content">
                    <div class="ai-name">${role.emoji} ${role.name}</div>
                    <div>${message.content}</div>
                    ${message.thinking ? `
                        <div class="thinking-chain" onclick="this.classList.toggle('expanded')">
                            <span class="thinking-icon">💭</span>
                            <span>思考过程</span>
                            <div style="display: none; margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
                                ${message.thinking}
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        }

        return messageDiv;
    }

    async sendMessage() {
        const input = document.getElementById('messageInput');
        const content = input.value.trim();

        if (!content || !this.state.currentSession) return;

        // 检查配置
        if (!this.state.config.apiKey) {
            alert('请先在配置中心设置API Key');
            return;
        }

        // 添加用户消息
        this.state.addMessage({
            role: 'user',
            content: content
        });

        input.value = '';
        this.renderChat();
        this.state.updateGrowthData('conversation');

        // 显示AI思考状态
        this.showAIThinking();

        try {
            // 调用AI接口
            const response = await this.callAI(content);
            this.hideAIThinking();

            // 添加AI回复
            this.state.addMessage({
                role: 'assistant',
                content: response.content,
                aiRole: response.aiRole,
                thinking: response.thinking
            });

            this.renderChat();
            this.updateGrowthUI();

        } catch (error) {
            this.hideAIThinking();
            console.error('AI调用失败:', error);
            alert('AI调用失败，请检查配置和网络连接');
        }
    }

    showAIThinking() {
        const chatMessages = document.getElementById('chatMessages');
        const thinkingDiv = document.createElement('div');
        thinkingDiv.id = 'thinking-indicator';
        thinkingDiv.className = 'message ai-message';
        thinkingDiv.innerHTML = `
            <div class="message-content">
                <div class="ai-name">🤔 AI正在思考</div>
                <div class="loading-dots">思考中</div>
            </div>
        `;
        
        const container = chatMessages.querySelector('.max-w-4xl');
        if (container) {
            container.appendChild(thinkingDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    hideAIThinking() {
        const thinkingIndicator = document.getElementById('thinking-indicator');
        if (thinkingIndicator) {
            thinkingIndicator.remove();
        }
    }

    async callAI(userMessage) {
        const { aiProvider, apiKey, textModel } = this.state.config;
        
        // 选择一个AI角色回复（简化版，实际应该更智能）
        const availableRoles = this.state.currentSession.aiRoles;
        const selectedRole = availableRoles[Math.floor(Math.random() * availableRoles.length)];
        const role = AI_ROLES[selectedRole];

        // 构建消息历史
        const messages = [
            {
                role: 'system',
                content: role.systemPrompt + '\n\n你正在参与一个AI圆桌讨论，需要根据你的角色特点给出建议。请保持简洁，一次回复不超过200字。'
            }
        ];

        // 添加最近的对话历史
        const recentMessages = this.state.currentSession.messages.slice(-6);
        recentMessages.forEach(msg => {
            if (msg.role === 'user') {
                messages.push({ role: 'user', content: msg.content });
            } else {
                messages.push({ role: 'assistant', content: msg.content });
            }
        });

        messages.push({ role: 'user', content: userMessage });

        let response;
        if (aiProvider === 'dashscope') {
            response = await this.callDashScope(messages, textModel, apiKey);
        } else {
            response = await this.callOpenRouter(messages, textModel, apiKey);
        }

        // 如果是第一条用户消息，尝试更新会话标题
        if (this.state.currentSession && this.state.currentSession.messages.length <= 1) {
            this.updateSessionTitle(userMessage);
        }

        return {
            content: response,
            aiRole: selectedRole,
            thinking: `选择了${role.name}来回复，基于角色特点：${role.description}`
        };
    }

    // 根据用户消息自动更新会话标题
    async updateSessionTitle(userMessage) {
        try {
            const { aiProvider, apiKey, textModel } = this.state.config;
            
            // 构建提示
            const titlePrompt = [
                {
                    role: 'system',
                    content: '你是一个标题生成助手。请根据用户的消息生成一个简短、具体的标题，不超过15个字。不要使用引号，直接给出标题文本。'
                },
                {
                    role: 'user',
                    content: `根据这条消息生成一个简短的会话标题：${userMessage}`
                }
            ];

            let titleResponse;
            if (aiProvider === 'dashscope') {
                titleResponse = await this.callDashScope(titlePrompt, textModel, apiKey);
            } else {
                titleResponse = await this.callOpenRouter(titlePrompt, textModel, apiKey);
            }

            // 清理标题文本
            const cleanTitle = titleResponse.replace(/["""]/g, '').trim();
            const finalTitle = `AI圆桌 · ${cleanTitle}`;
            
            // 更新会话标题
            if (this.state.currentSession) {
                this.state.currentSession.title = finalTitle;
                this.state.saveToStorage();
                this.renderSessions();
            }
        } catch (error) {
            console.error('自动生成标题失败:', error);
            // 失败时使用默认标题，不影响主要功能
        }
    }

    async callDashScope(messages, model, apiKey) {
        const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                temperature: 0.7,
                max_tokens: 500
            })
        });

        if (!response.ok) {
            throw new Error(`API调用失败: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    async callOpenRouter(messages, model, apiKey) {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                temperature: 0.7,
                max_tokens: 500
            })
        });

        if (!response.ok) {
            throw new Error(`API调用失败: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    searchSessions(query) {
        if (!query.trim()) {
            this.renderSessions();
            return;
        }

        const filteredSessions = this.state.sessions.filter(session => {
            return session.title.toLowerCase().includes(query.toLowerCase()) ||
                   session.messages.some(msg => 
                       msg.content.toLowerCase().includes(query.toLowerCase())
                   );
        });

        const sessionList = document.getElementById('sessionList');
        sessionList.innerHTML = '';

        filteredSessions.forEach(session => {
            const sessionElement = document.createElement('div');
            sessionElement.className = `session-item ${session === this.state.currentSession ? 'active' : ''}`;
            
            const lastMessage = session.messages[session.messages.length - 1];
            const preview = lastMessage ? 
                (lastMessage.role === 'user' ? lastMessage.content : `${lastMessage.aiRole}: ${lastMessage.content}`) : 
                '新建的圆桌对话';

            sessionElement.innerHTML = `
                <div class="session-title">${session.title}</div>
                <div class="session-preview">${preview.substring(0, 30)}${preview.length > 30 ? '...' : ''}</div>
            `;

            sessionElement.addEventListener('click', () => {
                this.switchToSession(session);
            });

            sessionList.appendChild(sessionElement);
        });
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new AIRoundtableApp();
});

// 思考链展开功能
document.addEventListener('click', (e) => {
    if (e.target.closest('.thinking-chain')) {
        const chain = e.target.closest('.thinking-chain');
        const content = chain.querySelector('div[style*="display: none"]');
        if (content) {
            if (content.style.display === 'none') {
                content.style.display = 'block';
                chain.classList.add('expanded');
            } else {
                content.style.display = 'none';
                chain.classList.remove('expanded');
            }
        }
    }
});
