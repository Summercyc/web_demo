一、整体氛围与视觉基调
🎨 视觉风格：“温暖的专业感”（Warm Professionalism）
结构借鉴：企业微信 / 钉钉的左侧导航结构，保障效率感
情感升级：脱离“冷办公”气质，使用温暖色调与轻盈交互
色彩体系：
主色：暖灰蓝 #5A7CA8（专业可信）
强调色：晨光橙 #FF9A4D（用于AI点亮、按钮、提示）
背景色：浅米白 #FEFCF7（减少视觉疲劳，适合长时间反思）
字体：系统默认无衬线字体（如 PingFang SC / SF Pro），清晰易读
💬 类比体验：像是在一间洒满阳光的会议室里，几位你信任的伙伴围坐一圈，认真听你说话。

二、信息架构与主界面设计（PC Web Only）
🏠 主界面结构示例
<TEXT>
+--------------------------------------------------+
|  🔍 搜索框（全局搜索聊天记录）                    |
|                                                  |
| 🔹 AI圆桌 · 成长对话 #20250405                    |
| 🔹 AI圆桌 · “要不要提离职？”                      |
| 🔹 AI圆桌 · 昨天被同事甩锅                        |
| 🔹 AI圆桌 · 升职答辩复盘                          |
|                                                  |
| ⚙️ 配置中心                                       |
| 📓 成长日志                                       |
+--------------------------------------------------+
|                                                  |
|        【主聊天窗口】                              |
|                                                  |
|  👤 用户：我今天提了个建议，领导当众说“太天真”…     |
|                                                  |
|  💬 [💡 老谋] 此刻头像微微点亮 →                 |
|     “这不是能力问题，是‘向上管理’时机问题。”       |
|                                                  |
|  💬 [💖 心理姐] 头像轻闪 →                        |
|     “被否定的感觉，像被人泼了冷水对吧？”           |
|                                                  |
|  🎯 输入框：[     输入你的想法…      ] [发送]       |
+--------------------------------------------------+
🧭 用户旅程
阶段	流程
首次进入	引导创建首场“圆桌对话”，选择AI角色，选择AI角色头像，生成专属群聊
后续进入	直接展示历史会话列表，点击即续聊，保留AI配置与上下文
新话题	点击“+新建圆桌” → 重新选择AI组合，开启新对话
三、AI角色系统设计
🎭 四位核心AI角色
角色	定位	语言风格	关键能力
Coach 小柯	成长引导者	温和、提问式	倾听 → 提问 → 总结 → 推动行动
Strategist 老谋	战略顾问	理性、框架清晰	拆解目标、权衡利弊、长期规划
Psychologist 心理姐	情绪伙伴	共情、细腻	情绪承接、认知重构、减压支持
Operator 阿操	落地专家	直接、高效	提供话术、模板、行动计划
✅ 角色管理功能：
可开关、可重命名（如“老铁”、“大树”）、可生成专属头像
可设置为默认角色组合（在配置中心）
四、多AI协同交互机制
1. 💡 AI角色动态点亮机制
当AI判断自己有贡献价值时：
对应头像在顶部角色栏 缓慢呼吸点亮（晨光橙，0.8s周期）
悬停显示预览语：“老谋：建议从组织利益角度包装建议”
用户可决定是否让其发言（未来可设“自动/手动”模式）
发言后亮度恢复，沉寂后变灰
2. 🧠 AI思考链可视化（点击可展开）
每条AI消息左上角带 💭 图标
点击展开显示内部思考过程：
<TEXT>
[思考链]
1. 情绪识别：“被否定” → 触发心理姐共情
2. 事件归类：“向上沟通” → 启动影响力模型
3. 判断需搜索 → 调用 search_web 工具
4. 综合三视角 → 生成回复
非默认展开，避免干扰
支持“常看”标记，后续自动展开
五、功能性动画设计（引导型，非装饰）
动画	用途
头像呼吸光	提示AI想发言，引导注意力
消息滑入	区分用户与AI，增强节奏感
tool_use loader	显示“正在搜索…”后台执行状态
复盘卡片浮出	营造“成果达成”的奖励感
思考气泡展开	内容渐现，降低认知负荷
所有动画速度 300–600ms，支持在配置中关闭

六、工具调用与Function Call承接机制
✅ 支持的工具能力
工具	用途	API
search_web	搜索外部信息	Google Custom Search JSON API
get_template	获取话术/邮件模板	内建知识库

🔗 前端承接逻辑
<TS>
onMessageStream((chunk) => {
  if (chunk.tool_use) {
    showLoader(`正在${getLabel(name)}...`);
    executeTool(name, input).then(result => {
      sendToModel({
        role: "user",
        content: `[工具返回] ${JSON.stringify(result)}`
      });
    });
  }
});
AI可继续生成：“我找到了3种拒绝话术，你看哪种适合？”

七、配置中心（Config Panel）
路径：/config

配置项	说明
阿里云百炼 API Key	输入框 + 🔒 加密缓存（不落地）
Google CSE	用于 search_web 工具调用
默认AI角色集	多选框（新建会话时预加载）
思维风格偏好	[和谐共进] / [思维碰撞]
动画开关	关闭所有非必要动画
✅ 安全提示：API Key 不参与任何后端传输

八、成长日志系统（核心升级模块）
🎯 核心理念
让成长被看见、被记住、被热爱。

不再是“档案夹”，而是用户的 心智成长博物馆 + 互动情感空间。

1. 📌 卡片档案馆
存储所有复盘卡片（闪电 & 深潜）
支持：
时间轴浏览（日/周/月）
标签分类：#沟通 #情绪 #决策
情绪曲线可视化
行动完成度标记
彩蛋机制：
连续7天生成卡片 → 解锁“沉思者”徽章
情绪波动最大 → 触发：“那天你真的很不容易”
2. 📊 成长可视化仪表盘
系统自动分析生成：

维度	示例洞察
高频挑战	“你在‘向上沟通’上纠结了12次”
情绪模式	“80%低落发生在周一上午”
进步对比	“3个月前你说‘我不行’，现在你说‘我可以调整’”
行动力	“本月完成率72% → 超过78%用户”
展示形式：
雷达图：表达力 / 决策力 / 情绪管理 / 执行力 / 边界感
时间线事件墙：自动标记突破节点
3. 🌳 成长树养成系统（核心趣味互动）参考Frest
养成机制：
行为	反馈
生成一张卡片	浇一次水 💧
完成一个行动	长出一片叶 🍃
触发认知升级	开一朵花 🌸
连续7天参与	树干升一级（幼苗 → 苍树）
交互设计：
点击树叶 → 查看对应卡片
点击花朵 → 播放音效 + 显示成就
悬停树干 → 显示成长数据
动画与氛围：
四季变化：春芽 / 夏荫 / 秋叶 / 冬雪
树木可选品种：橡树 / 樱花 / 竹子（象征成长风格）
4. 📄 阶段性成长总结（Monthly Recap）
每月1日自动生成《成长月报》，示例：

<TEXT>
📄 你的4月成长报告 · 已生成
 
🌱 成长树状态：Level 3 · 繁茂期  
📈 行动力：完成了8/10个计划（+15% vs 上月）  
💬 最常说的一句话：“我可以换个方式试试”  
🎯 突破时刻：第一次在会议上反驳不合理安排  
🧠 认知升级提醒：你开始区分“责任”与“义务”  
🌸 本月花开：3朵  
 
🎁 解锁成就：【破土者】连续参与7天  
✨ 特别提示：你的情绪恢复速度比上月快了22%
功能支持：
一键生成图片分享
点击条目跳转原始卡片
九、技术架构说明
前端：HTML + Tailwind + Js
后端：FastAPI + Template ，数据使用 SQLite 保存
主AI接口：阿里云百炼 API（你自行接入）


✅ 前端负责：拦截 tool_use → 调用工具 → 回传 tool_result → 渲染思考链与动画

十、功能清单
模块	功能
主界面	左侧会话导航，类企业微信
圆桌创建	引导选择AI角色，生成群聊
AI交互	头像点亮、思考链可展开、多角色协同
工具调用	支持 search_web 等 function call
复盘系统	闪电复盘 + 深潜复盘
成长日志	卡片档案、可视化分析、成长树、月报
配置中心	API Key、CSE ID、偏好设置
搜索功能	全局搜索历史对话
动画系统	功能性引导动画，可关闭


## 你需要在服务端提供配置 KEY 的位置，允许用户设置Key、模型名。
默认文本模型：qwen-plus
默认生图模型：wan2.2-t2i-flash

## 默认接入平台提供方（阿里云百炼），你需要再次咨询用户，确认是只接入阿里云百炼或者 OpenRouter

# 通义千问（阿里云百炼）
## 通义千问模型列表：
curl --location 'https://dashscope.aliyuncs.com/compatible-mode/v1/models' \
--header 'Authorization: Bearer <YOUR-DASHSCOPE-API-KEY>' \
--header 'Content-Type: application/json' \

## 通义千问（非流式）：
curl -X POST https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions \
-H "Authorization: Bearer $DASHSCOPE_API_KEY" \
-H "Content-Type: application/json" \
-d '{
    "model": "qwen-plus",
    "messages": [
        {
            "role": "system",
            "content": "You are a helpful assistant."
        },
        {
            "role": "user", 
            "content": "你是谁？"
        }
    ]
}'

## 通义千问（流式）：
curl --location "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions" \
--header "Authorization: Bearer $DASHSCOPE_API_KEY" \
--header "Content-Type: application/json" \
--data '{
    "model": "qwen-plus",
    "messages": [
        {
            "role": "system",
            "content": "You are a helpful assistant."
        },
        {
            "role": "user", 
            "content": "你是谁？"
        }
    ],
    "stream":true
}'

## 通义千问流式返回格式：
data: {"choices":[{"delta":{"content":"","role":"assistant"},"index":0,"logprobs":null,"finish_reason":null}],"object":"chat.completion.chunk","usage":null,"created":1726132850,"system_fingerprint":null,"model":"qwen-max","id":"chatcmpl-428b414f"}
data: {"choices":[{"finish_reason":null,"delta":{"content":"我是"},"index":0,"logprobs":null}],"object":"chat.completion.chunk","usage":null,"created":1726132850,"system_fingerprint":null,"model":"qwen-max","id":"chatcmpl-428b414f"}
data: {"choices":[{"delta":{"content":"来自"},"finish_reason":null,"index":0,"logprobs":null}],"object":"chat.completion.chunk","usage":null,"created":1726132850,"system_fingerprint":null,"model":"qwen-max","id":"chatcmpl-428b414f"}
…
data: {"choices":[],"object":"chat.completion.chunk","usage":{"prompt_tokens":22,"completion_tokens":17,"total_tokens":39},"created":1726132850,"system_fingerprint":null,"model":"qwen-max","id":"chatcmpl-428b414f"}
data: [DONE]


## 通义万象 2.2 获取 ID：
curl -X POST https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis \
    -H 'X-DashScope-Async: enable' \
    -H "Authorization: Bearer $DASHSCOPE_API_KEY" \
    -H 'Content-Type: application/json' \
    -d '{
    "model": "wan2.2-t2i-flash",
    "input": {
        "prompt": "一间有着精致窗户的花店，漂亮的木质门，摆放着花朵"
    },
    "parameters": {
        "size": "1024*1024",
        "n": 1
    }
}'    

###成功：
{
    "output": {
        "task_status": "PENDING",
        "task_id": "0385dc79-5ff8-4d82-bcb6-xxxxxx"
    },
    "request_id": "4909100c-7b5a-9f92-bfe5-xxxxxx"
}


## 通义万象 2.2 获取结果
curl -X GET \
--header "Authorization: Bearer $DASHSCOPE_API_KEY" \
https://dashscope.aliyuncs.com/api/v1/tasks/86ecf553-d340-4e21-xxxxxxxxx


### 成功：
{
    "request_id": "f767d108-7d50-908b-a6d9-xxxxxx",
    "output": {
        "task_id": "d492bffd-10b5-4169-b639-xxxxxx",
        "task_status": "SUCCEEDED",
        "submit_time": "2025-01-08 16:03:59.840",
        "scheduled_time": "2025-01-08 16:03:59.863",
        "end_time": "2025-01-08 16:04:10.660",
        "results": [
            {
                "orig_prompt": "一间有着精致窗户的花店，漂亮的木质门，摆放着花朵",
                "actual_prompt": "一间有着精致雕花窗户的花店，漂亮的深色木质门上挂着铜制把手。店内摆放着各式各样的鲜花，包括玫瑰、百合和向日葵，色彩鲜艳，生机勃勃。背景是温馨的室内场景，透过窗户可以看到街道。高清写实摄影，中景构图。",
                "url": "https://dashscope-result-wlcb.oss-cn-wulanchabu.aliyuncs.com/1.png"
            }
        ],
        "task_metrics": {
            "TOTAL": 1,
            "SUCCEEDED": 1,
            "FAILED": 0
        }
    },
    "usage": {
        "image_count": 1
    }
}

### 失败：
{
    "request_id": "e5d70b02-ebd3-98ce-9fe8-759d7d7b107d",
    "output": {
        "task_id": "86ecf553-d340-4e21-af6e-xxxxxx",
        "task_status": "FAILED",
        "code": "InvalidParameter",
        "message": "xxxxxx",
        "task_metrics": {
            "TOTAL": 4,
            "SUCCEEDED": 0,
            "FAILED": 4
        }
    }
}

# （各类模型）OpenRouter
## 获取模型列表
curl https://openrouter.ai/api/v1/models
### 返回
{
  "data": [
    {
      "id": "string",
      "name": "string",
      "created": 1741818122,
      "description": "string",
      "architecture": {
        "input_modalities": [
          "text",
          "image"
        ],
        "output_modalities": [
          "text"
        ],
        "tokenizer": "GPT",
        "instruct_type": "string"
      },
      "top_provider": {
        "is_moderated": true,
        "context_length": 128000,
        "max_completion_tokens": 16384
      },
      "pricing": {
        "prompt": "0.0000007",
        "completion": "0.0000007",
        "image": "0",
        "request": "0",
        "web_search": "0",
        "internal_reasoning": "0",
        "input_cache_read": "0",
        "input_cache_write": "0"
      },
      "canonical_slug": "string",
      "context_length": 128000,
      "hugging_face_id": "string",
      "per_request_limits": {},
      "supported_parameters": [
        "string"
      ]
    }
  ]
}


## 对话
curl https://openrouter.ai/api/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -d '{
  "model": "openai/gpt-4o",
  "messages": [
    {
      "role": "user",
      "content": "What is the meaning of life?"
    }
  ]
}'

### 返回（非流式）
{
  "id": "gen-12345",
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "The meaning of life is a complex and subjective question...",
        "refusal": ""
      },
      "logprobs": {},
      "finish_reason": "stop",
      "index": 0
    }
  ],
  "provider": "OpenAI",
  "model": "openai/gpt-3.5-turbo",
  "object": "chat.completion",
  "created": 1735317796,
  "system_fingerprint": {},
  "usage": {
    "prompt_tokens": 14,
    "completion_tokens": 163,
    "total_tokens": 177
  }
}

### 流式
: OPENROUTER PROCESSING
data: {"id":"gen-1754191709","provider":"Alibaba","model":"qwen/qwen3","object":"chat.completion.chunk","created":1754191709,"choices":[{"index":0,"delta":{"role":"assistant","content":""},"finish_reason":null,"native_finish_reason":null,"logprobs":null}],"system_fingerprint":null}
data: {"id":"gen-1754191709","provider":"Alibaba","model":"qwen/qwen3","object":"chat.completion.chunk","created":1754191709,"choices":[{"index":0,"delta":{"role":"assistant","content":"你好"},"finish_reason":null,"native_finish_reason":null,"logprobs":null}],"system_fingerprint":null}
data: {"id":"gen-1754191709","provider":"Alibaba","model":"qwen/qwen3","object":"chat.completion.chunk","created":1754191709,"choices":[{"index":0,"delta":{"role":"assistant","content":"！"},"finish_reason":null,"native_finish_reason":null,"logprobs":null}],"system_fingerprint":null}
data: {"id":"gen-1754191709","provider":"Alibaba","model":"qwen/qwen3","object":"chat.completion.chunk","created":1754191709,"choices":[{"index":0,"delta":{"role":"assistant","content":""},"finish_reason":"stop","native_finish_reason":"stop","logprobs":null}],"system_fingerprint":null}
data: {"id":"gen-1754191709","provider":"Alibaba","model":"qwen/qwen3","object":"chat.completion.chunk","created":1754191709,"choices":[{"index":0,"delta":{"role":"assistant","content":""},"finish_reason":null,"native_finish_reason":null,"logprobs":null}],"usage":{"prompt_tokens":14,"completion_tokens":2,"total_tokens":16}}
data: [DONE]