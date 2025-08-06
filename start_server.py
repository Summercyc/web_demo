import http.server
import socketserver
import webbrowser
import os

PORT = 8092

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-DashScope-Async')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        print(f"🚀 AI圆桌成长系统启动在 http://localhost:{PORT}")
        print("📡 支持月度报告AI分析，直接调用配置的AI服务")
        print("🔧 支持的AI服务: 阿里云百炼, OpenRouter")
        print("按 Ctrl+C 停止服务器")
        print("-" * 50)
        
        # 自动打开浏览器
        webbrowser.open(f'http://localhost:{PORT}')
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n✅ 服务器已停止")
            httpd.shutdown()