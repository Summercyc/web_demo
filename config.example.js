// 配置示例文件
// 复制此文件为 config.js 并填入您的配置信息

window.CONFIG = {
    // AI服务提供商配置
    AI_PROVIDERS: {
        // 阿里云百炼配置
        dashscope: {
            name: '阿里云百炼',
            apiUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
            models: [
                { value: 'qwen-plus', name: 'Qwen-Plus (推荐)' },
                { value: 'qwen-max', name: 'Qwen-Max (最强)' },
                { value: 'qwen-turbo', name: 'Qwen-Turbo (快速)' }
            ],
            // 获取API Key: https://dashscope.console.aliyun.com/
            apiKey: '', // 在这里填入您的API Key
        },
        
        // OpenRouter配置
        openrouter: {
            name: 'OpenRouter',
            apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
            models: [
                { value: 'openai/gpt-4o', name: 'GPT-4o' },
                { value: 'openai/gpt-4o-mini', name: 'GPT-4o Mini' },
                { value: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
                { value: 'qwen/qwen-2.5-72b-instruct', name: 'Qwen 2.5 72B' }
            ],
            // 获取API Key: https://openrouter.ai/
            apiKey: '', // 在这里填入您的API Key
        }
    },

    // Google自定义搜索配置（可选）
    GOOGLE_CSE: {
        // 获取CSE ID: https://cse.google.com/
        cseId: '', // 在这里填入您的CSE ID
        // 获取API Key: https://console.developers.google.com/
        apiKey: '' // 在这里填入您的Google API Key
    },

    // 默认设置
    DEFAULTS: {
        aiProvider: 'dashscope', // 默认AI提供商
        textModel: 'qwen-plus', // 默认文本模型
        enableAnimations: true, // 是否启用动画
        defaultAiRoles: ['coach', 'strategist'], // 默认AI角色
        maxHistoryMessages: 10, // 最大历史消息数
        responseTimeout: 30000, // 响应超时时间(毫秒)
    },

    // UI主题配置
    THEME: {
        colors: {
            primary: '#5A7CA8', // 主色调
            accent: '#FF9A4D', // 强调色
            background: '#FEFCF7', // 背景色
        },
        animations: {
            duration: 300, // 动画持续时间(毫秒)
            easing: 'ease-out' // 动画缓动函数
        }
    }
};

// 使用说明：
// 1. 将此文件复制为 config.js
// 2. 在对应的 apiKey 字段填入您的API密钥
// 3. 根据需要调整其他配置项
// 4. 保存文件后刷新页面即可生效

// 注意事项：
// - API Key 是敏感信息，请勿分享给他人
// - 建议将 config.js 添加到 .gitignore 中避免意外提交
// - 如果不使用某个服务，可以将对应的 apiKey 留空