const express = require('express');
const router = express.Router();
const auth = require('./auth');

// 用户注册
router.post('/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: '密码长度不能少于6个字符' });
    }
    
    const user = await auth.registerUser(username, password, email);
    res.status(201).json({ message: '注册成功', user });
  } catch (error) {
    console.error('注册时出错:', error);
    res.status(400).json({ error: error.message });
  }
});

// 用户登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    const userAgent = req.get('User-Agent');
    
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }
    
    const result = await auth.loginUser(username, password, ip, userAgent);
    
    // 设置HTTP-only cookie
    res.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24小时
    });
    
    res.json({ 
      message: '登录成功', 
      user: result.user 
    });
  } catch (error) {
    console.error('登录时出错:', error);
    res.status(401).json({ error: error.message });
  }
});

// 用户退出登录
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: '退出登录成功' });
});

// 获取当前用户信息
router.get('/me', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: '未登录' });
    }
    
    const decoded = await auth.verifyToken(token);
    const user = await auth.getUserById(decoded.id);
    
    res.json({ user });
  } catch (error) {
    console.error('获取用户信息时出错:', error);
    res.status(401).json({ error: error.message });
  }
});

// 修改密码
router.post('/change-password', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: '未登录' });
    }
    
    const decoded = await auth.verifyToken(token);
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: '当前密码和新密码不能为空' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: '新密码长度不能少于6个字符' });
    }
    
    await auth.changePassword(decoded.id, currentPassword, newPassword);
    res.json({ message: '密码修改成功' });
  } catch (error) {
    console.error('修改密码时出错:', error);
    res.status(400).json({ error: error.message });
  }
});

// 获取所有用户（管理员功能）
router.get('/users', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: '未登录' });
    }
    
    const decoded = await auth.verifyToken(token);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: '权限不足' });
    }
    
    const users = await auth.getAllUsers(decoded.id);
    res.json({ users });
  } catch (error) {
    console.error('获取用户列表时出错:', error);
    res.status(500).json({ error: error.message });
  }
});

// 管理员重置用户密码
router.post('/reset-password/:userId', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: '未登录' });
    }

    const decoded = await auth.verifyToken(token);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: '权限不足' });
    }

    const { userId } = req.params;
    const { newPassword } = req.body;
    const ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: '新密码长度不能少于6个字符' });
    }

    await auth.resetUserPassword(decoded.id, userId, newPassword, ip);
    res.json({ message: '密码重置成功' });
  } catch (error) {
    console.error('重置密码时出错:', error);
    res.status(500).json({ error: error.message });
  }
});

// 管理员更新用户状态
router.post('/users/:userId/status', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: '未登录' });
    }

    const decoded = await auth.verifyToken(token);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: '权限不足' });
    }

    const { userId } = req.params;
    const { status } = req.body;
    const ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;

    if (!['active', 'disabled'].includes(status)) {
      return res.status(400).json({ error: '无效的状态值' });
    }

    await auth.updateUserStatus(decoded.id, userId, status, ip);
    res.json({ message: '用户状态更新成功' });
  } catch (error) {
    console.error('更新用户状态时出错:', error);
    res.status(500).json({ error: error.message });
  }
});

// 管理员更新用户角色
router.post('/users/:userId/role', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: '未登录' });
    }

    const decoded = await auth.verifyToken(token);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: '权限不足' });
    }

    const { userId } = req.params;
    const { role } = req.body;
    const ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: '无效的角色值' });
    }

    await auth.updateUserRole(decoded.id, userId, role, ip);
    res.json({ message: '用户角色更新成功' });
  } catch (error) {
    console.error('更新用户角色时出错:', error);
    res.status(500).json({ error: error.message });
  }
});

// 管理员更新用户信息
router.put('/users/:userId', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: '未登录' });
    }

    const decoded = await auth.verifyToken(token);
    const { userId } = req.params;

    // 只有管理员或用户本人可以修改信息
    if (decoded.role !== 'admin' && decoded.id !== parseInt(userId)) {
      return res.status(403).json({ error: '权限不足' });
    }

    const { email } = req.body;
    await auth.updateUserInfo(decoded.id, userId, { email });
    res.json({ message: '用户信息更新成功' });
  } catch (error) {
    console.error('更新用户信息时出错:', error);
    res.status(500).json({ error: error.message });
  }
});

// 获取运营统计数据
router.get('/dashboard/stats', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: '未登录' });
    }

    const decoded = await auth.verifyToken(token);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: '权限不足' });
    }

    const stats = await auth.getUserStats();
    res.json({ stats });
  } catch (error) {
    console.error('获取运营统计数据时出错:', error);
    res.status(500).json({ error: error.message });
  }
});

// 获取日活跃用户数据
router.get('/dashboard/dau', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: '未登录' });
    }

    const decoded = await auth.verifyToken(token);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: '权限不足' });
    }

    const days = parseInt(req.query.days) || 30;
    const dauData = await auth.getDailyActiveUsers(days);
    res.json({ dauData });
  } catch (error) {
    console.error('获取DAU数据时出错:', error);
    res.status(500).json({ error: error.message });
  }
});

// 搜索和筛选用户
router.get('/users/search', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: '未登录' });
    }

    const decoded = await auth.verifyToken(token);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: '权限不足' });
    }

    const { search = '', role = '', status = '', page = 1, limit = 20 } = req.query;
    const result = await auth.getUsersWithFilter(
      decoded.id,
      search,
      role,
      status,
      parseInt(page),
      parseInt(limit)
    );

    res.json(result);
  } catch (error) {
    console.error('搜索用户时出错:', error);
    res.status(500).json({ error: error.message });
  }
});

// 获取审计日志
router.get('/audit-logs', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: '未登录' });
    }

    const decoded = await auth.verifyToken(token);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: '权限不足' });
    }

    const { page = 1, limit = 50 } = req.query;
    const result = await auth.getAuditLogs(
      decoded.id,
      parseInt(page),
      parseInt(limit)
    );

    res.json(result);
  } catch (error) {
    console.error('获取审计日志时出错:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;