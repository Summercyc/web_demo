#!/usr/bin/env python3
"""
AI圆桌成长系统 - 启动脚本
让用户选择运行基础版或增强版服务器
"""

import sys
import subprocess
import os

def main():
    print("🌳 AI圆桌成长系统")
    print("=" * 40)
    print("✨ 系统已完美集成AI分析功能")
    print("🔗 直接使用您配置的API密钥调用AI服务")
    print()
    
    # 直接启动，简化用户操作
    print("🚀 启动AI圆桌成长系统...")
    try:
        subprocess.run([sys.executable, "start_server.py"], check=True)
    except KeyboardInterrupt:
        print("\n✅ 服务器已停止")
    except FileNotFoundError:
        print("❌ 找不到 start_server.py 文件")
        print("请确保在正确的目录中运行此脚本")

if __name__ == "__main__":
    main()