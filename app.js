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
            actions: 0
        };
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
    }

    saveToStorage() {
        localStorage.setItem('aiRoundtableConfig', JSON.stringify(this.config));
        localStorage.setItem('aiRoundtableSessions', JSON.stringify(this.sessions));
        localStorage.setItem('aiRoundtableGrowth', JSON.stringify(this.growthData));
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

    updateGrowthData(type) {
        switch (type) {
            case 'conversation':
                this.growthData.conversations++;
                break;
            case 'card':
                this.growthData.cards++;
                break;
            case 'action':
                this.growthData.actions++;
                break;
        }
        
        // 计算等级
        const totalPoints = this.growthData.conversations + this.growthData.cards * 2 + this.growthData.actions * 3;
        this.growthData.level = Math.floor(totalPoints / 10) + 1;
        
        this.saveToStorage();
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
        this.init();
    }

    init() {
        this.bindEvents();
        this.renderSessions();
        this.updateConfigUI();
        this.updateGrowthUI();
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
        // 更新成长树
        const treeElement = document.getElementById('growthTree');
        const level = this.state.growthData.level;
        
        if (level <= 3) {
            treeElement.textContent = '🌱';
        } else if (level <= 6) {
            treeElement.textContent = '🌿';
        } else if (level <= 10) {
            treeElement.textContent = '🌳';
        } else {
            treeElement.textContent = '🌲';
        }

        // 更新统计数据
        const stats = document.querySelectorAll('#growthLogModal .grid .text-2xl');
        if (stats.length >= 3) {
            stats[0].textContent = this.state.growthData.conversations;
            stats[1].textContent = this.state.growthData.cards;
            stats[2].textContent = this.state.growthData.actions;
        }
    }

    hideAllModals() {
        this.hideNewRoundtableModal();
        this.hideConfigModal();
        this.hideGrowthLogModal();
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

        return {
            content: response,
            aiRole: selectedRole,
            thinking: `选择了${role.name}来回复，基于角色特点：${role.description}`
        };
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
