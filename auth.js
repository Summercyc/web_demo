const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

// 确保数据目录存在
const dbDir = path.join(__dirname, 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir);
}

// 创建数据库连接
const db = new sqlite3.Database(path.join(dbDir, 'users.db'));

// JWT密钥
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// 初始化数据库表
function initDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      console.log('开始初始化数据库表...');
      
      // 创建用户表
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          email TEXT UNIQUE,
          role TEXT DEFAULT 'user',
          status TEXT DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_login DATETIME
        )
      `, (err) => {
        if (err) {
          console.error('创建users表时出错:', err);
        } else {
          console.log('users表创建成功');
        }
      });

      // 创建登录失败记录表
      db.run(`
        CREATE TABLE IF NOT EXISTS login_attempts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          ip_address TEXT NOT NULL,
          attempt_time DATETIME DEFAULT CURRENT_TIMESTAMP,
          username TEXT
        )
      `, (err) => {
        if (err) {
          console.error('创建login_attempts表时出错:', err);
        } else {
          console.log('login_attempts表创建成功');
        }
      });

      // 创建IP黑名单表
      db.run(`
        CREATE TABLE IF NOT EXISTS ip_blacklist (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          ip_address TEXT UNIQUE NOT NULL,
          blocked_until DATETIME NOT NULL
        )
      `, (err) => {
        if (err) {
          console.error('创建ip_blacklist表时出错:', err);
        } else {
          console.log('ip_blacklist表创建成功');
        }
      });

      // 创建用户活跃度记录表
      db.run(`
        CREATE TABLE IF NOT EXISTS user_activity (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          activity_type TEXT NOT NULL,
          activity_time DATETIME DEFAULT CURRENT_TIMESTAMP,
          ip_address TEXT,
          user_agent TEXT,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `, (err) => {
        if (err) {
          console.error('创建user_activity表时出错:', err);
        } else {
          console.log('user_activity表创建成功');
        }
      });

      // 创建审计日志表
      db.run(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          admin_id INTEGER NOT NULL,
          admin_username TEXT NOT NULL,
          action TEXT NOT NULL,
          target_user_id INTEGER,
          target_username TEXT,
          details TEXT,
          ip_address TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (admin_id) REFERENCES users (id),
          FOREIGN KEY (target_user_id) REFERENCES users (id)
        )
      `, (err) => {
        if (err) {
          console.error('创建audit_logs表时出错:', err);
        } else {
          console.log('audit_logs表创建成功');
        }
      });

      // 检查是否存在管理员账户，如果不存在则创建
      db.get("SELECT * FROM users WHERE username = 'admin'", [], async (err, row) => {
        if (err) {
          console.error('查询管理员账户时出错:', err);
          return;
        }

        if (!row) {
          try {
            // 创建默认管理员账户
            const hashedPassword = await bcrypt.hash('admin123', 10);
            db.run(
              "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
              ['admin', hashedPassword, 'admin'],
              (err) => {
                if (err) {
                  console.error('创建管理员账户时出错:', err);
                } else {
                  console.log('已创建默认管理员账户: admin/admin123');
                }
                resolve();
              }
            );
          } catch (error) {
            console.error('哈希密码时出错:', error);
            resolve();
          }
        } else {
          console.log('管理员账户已存在');
          resolve();
        }
      });
    });
  });
}

// 检查IP是否被拉黑
function isIpBlacklisted(ip) {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT * FROM ip_blacklist WHERE ip_address = ? AND blocked_until > datetime('now')",
      [ip],
      (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(!!row);
      }
    );
  });
}

// 记录登录失败
function recordLoginAttempt(ip, username) {
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO login_attempts (ip_address, username) VALUES (?, ?)",
      [ip, username],
      function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve(this.lastID);
      }
    );
  });
}

// 检查登录失败次数
function checkLoginAttempts(ip) {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT COUNT(*) as count FROM login_attempts WHERE ip_address = ? AND attempt_time > datetime('now', '-1 hour')",
      [ip],
      (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row ? row.count : 0);
      }
    );
  });
}

// 将IP加入黑名单
function blacklistIp(ip) {
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT OR REPLACE INTO ip_blacklist (ip_address, blocked_until) VALUES (?, datetime('now', '+24 hours'))",
      [ip],
      function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve(this.lastID);
      }
    );
  });
}

// 注册新用户
async function registerUser(username, password, email) {
  // 检查用户名是否已存在
  return new Promise((resolve, reject) => {
    db.get("SELECT id FROM users WHERE username = ?", [username], async (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (row) {
        reject(new Error('用户名已存在'));
        return;
      }
      
      try {
        // 密码加盐哈希
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // 插入新用户
        db.run(
          "INSERT INTO users (username, password, email) VALUES (?, ?, ?)",
          [username, hashedPassword, email],
          function(err) {
            if (err) {
              reject(err);
              return;
            }
            resolve({ id: this.lastID, username, email });
          }
        );
      } catch (error) {
        reject(error);
      }
    });
  });
}

// 记录用户活跃度
function recordUserActivity(userId, activityType, ip, userAgent) {
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO user_activity (user_id, activity_type, ip_address, user_agent) VALUES (?, ?, ?, ?)",
      [userId, activityType, ip, userAgent],
      function(err) {
        if (err) {
          console.error('记录用户活跃度时出错:', err);
          // 不阻塞主流程，只记录错误
          resolve();
          return;
        }
        resolve(this.lastID);
      }
    );
  });
}

// 记录审计日志
function recordAuditLog(adminId, adminUsername, action, targetUserId, targetUsername, details, ip) {
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO audit_logs (admin_id, admin_username, action, target_user_id, target_username, details, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [adminId, adminUsername, action, targetUserId, targetUsername, details, ip],
      function(err) {
        if (err) {
          console.error('记录审计日志时出错:', err);
          // 不阻塞主流程，只记录错误
          resolve();
          return;
        }
        resolve(this.lastID);
      }
    );
  });
}

// 用户登录
async function loginUser(username, password, ip, userAgent) {
  // 检查IP是否被拉黑
  const isBlacklisted = await isIpBlacklisted(ip);
  if (isBlacklisted) {
    throw new Error('您的IP已被临时禁止登录，请24小时后再试');
  }
  
  // 检查登录失败次数
  const attempts = await checkLoginAttempts(ip);
  if (attempts >= 5) {
    await blacklistIp(ip);
    throw new Error('登录失败次数过多，您的IP已被临时禁止登录24小时');
  }
  
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (!user) {
        await recordLoginAttempt(ip, username);
        reject(new Error('用户名或密码错误'));
        return;
      }
      
      if (user.status !== 'active') {
        reject(new Error('账户已被禁用，请联系管理员'));
        return;
      }
      
      try {
        // 验证密码
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
          await recordLoginAttempt(ip, username);
          reject(new Error('用户名或密码错误'));
          return;
        }
        
        // 更新最后登录时间
        db.run("UPDATE users SET last_login = datetime('now') WHERE id = ?", [user.id]);
        
        // 记录用户活跃度
        await recordUserActivity(user.id, 'login', ip, userAgent);
        
        // 生成JWT令牌
        const token = jwt.sign(
          { id: user.id, username: user.username, role: user.role },
          JWT_SECRET,
          { expiresIn: '24h' }
        );
        
        resolve({
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  });
}

// 获取用户信息
function getUserById(userId) {
  return new Promise((resolve, reject) => {
    db.get("SELECT id, username, email, role, status, created_at, last_login FROM users WHERE id = ?", [userId], (err, user) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (!user) {
        reject(new Error('用户不存在'));
        return;
      }
      
      resolve(user);
    });
  });
}

// 修改密码
async function changePassword(userId, currentPassword, newPassword) {
  return new Promise((resolve, reject) => {
    db.get("SELECT password FROM users WHERE id = ?", [userId], async (err, user) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (!user) {
        reject(new Error('用户不存在'));
        return;
      }
      
      try {
        // 验证当前密码
        const match = await bcrypt.compare(currentPassword, user.password);
        if (!match) {
          reject(new Error('当前密码不正确'));
          return;
        }
        
        // 哈希新密码
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // 更新密码
        db.run("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, userId], function(err) {
          if (err) {
            reject(err);
            return;
          }
          resolve({ success: true });
        });
      } catch (error) {
        reject(error);
      }
    });
  });
}

// 管理员重置用户密码
async function resetUserPassword(adminId, userId, newPassword, ip) {
  return new Promise((resolve, reject) => {
    // 验证操作者是否为管理员
    db.get("SELECT username, role FROM users WHERE id = ?", [adminId], async (err, admin) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (!admin || admin.role !== 'admin') {
        reject(new Error('权限不足'));
        return;
      }
      
      // 获取目标用户信息
      db.get("SELECT username FROM users WHERE id = ?", [userId], async (err, targetUser) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (!targetUser) {
          reject(new Error('目标用户不存在'));
          return;
        }
        
        try {
          // 哈希新密码
          const hashedPassword = await bcrypt.hash(newPassword, 10);
          
          // 更新密码
          db.run("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, userId], async function(err) {
            if (err) {
              reject(err);
              return;
            }
            
            // 记录审计日志
            await recordAuditLog(
              adminId,
              admin.username,
              '重置用户密码',
              userId,
              targetUser.username,
              `管理员重置了用户 ${targetUser.username} 的密码`,
              ip
            );
            
            resolve({ success: true });
          });
        } catch (error) {
          reject(error);
        }
      });
    });
  });
}

// 获取所有用户列表（管理员功能）
function getAllUsers(adminId) {
  return new Promise((resolve, reject) => {
    // 验证操作者是否为管理员
    db.get("SELECT role FROM users WHERE id = ?", [adminId], (err, admin) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (!admin || admin.role !== 'admin') {
        reject(new Error('权限不足'));
        return;
      }
      
      db.all("SELECT id, username, email, role, status, created_at, last_login FROM users", [], (err, users) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(users);
      });
    });
  });
}

// 更新用户状态（启用/禁用）
function updateUserStatus(adminId, userId, status, ip) {
  return new Promise((resolve, reject) => {
    // 验证操作者是否为管理员
    db.get("SELECT username, role FROM users WHERE id = ?", [adminId], (err, admin) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (!admin || admin.role !== 'admin') {
        reject(new Error('权限不足'));
        return;
      }
      
      // 防止管理员禁用自己
      if (parseInt(adminId) === parseInt(userId)) {
        reject(new Error('不能修改自己的账户状态'));
        return;
      }
      
      // 获取目标用户信息
      db.get("SELECT username FROM users WHERE id = ?", [userId], async (err, targetUser) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (!targetUser) {
          reject(new Error('目标用户不存在'));
          return;
        }
        
        db.run("UPDATE users SET status = ? WHERE id = ?", [status, userId], async function(err) {
          if (err) {
            reject(err);
            return;
          }
          
          // 记录审计日志
          const action = status === 'active' ? '启用用户账户' : '禁用用户账户';
          await recordAuditLog(
            adminId,
            admin.username,
            action,
            userId,
            targetUser.username,
            `管理员将用户 ${targetUser.username} 的状态设置为 ${status}`,
            ip
          );
          
          resolve({ success: true });
        });
      });
    });
  });
}

// 更新用户角色
function updateUserRole(adminId, userId, role, ip) {
  return new Promise((resolve, reject) => {
    // 验证操作者是否为管理员
    db.get("SELECT username, role FROM users WHERE id = ?", [adminId], (err, admin) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (!admin || admin.role !== 'admin') {
        reject(new Error('权限不足'));
        return;
      }
      
      // 防止管理员修改自己的角色
      if (parseInt(adminId) === parseInt(userId)) {
        reject(new Error('不能修改自己的角色'));
        return;
      }
      
      // 获取目标用户信息
      db.get("SELECT username FROM users WHERE id = ?", [userId], async (err, targetUser) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (!targetUser) {
          reject(new Error('目标用户不存在'));
          return;
        }
        
        db.run("UPDATE users SET role = ? WHERE id = ?", [role, userId], async function(err) {
          if (err) {
            reject(err);
            return;
          }
          
          // 记录审计日志
          const roleText = role === 'admin' ? '管理员' : '普通用户';
          await recordAuditLog(
            adminId,
            admin.username,
            '修改用户角色',
            userId,
            targetUser.username,
            `管理员将用户 ${targetUser.username} 的角色设置为 ${roleText}`,
            ip
          );
          
          resolve({ success: true });
        });
      });
    });
  });
}

// 更新用户信息
function updateUserInfo(adminId, userId, userData) {
  return new Promise((resolve, reject) => {
    // 验证操作者是否为管理员或用户本人
    db.get("SELECT role FROM users WHERE id = ?", [adminId], (err, user) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (!user) {
        reject(new Error('用户不存在'));
        return;
      }
      
      // 只有管理员或用户本人可以修改信息
      if (user.role !== 'admin' && parseInt(adminId) !== parseInt(userId)) {
        reject(new Error('权限不足'));
        return;
      }
      
      // 构建更新语句
      const { email } = userData;
      db.run("UPDATE users SET email = ? WHERE id = ?", [email, userId], function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve({ success: true });
      });
    });
  });
}

// 验证JWT令牌中间件
function verifyToken(token) {
  return new Promise((resolve, reject) => {
    if (!token) {
      reject(new Error('未提供认证令牌'));
      return;
    }
    
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        reject(new Error('无效的认证令牌'));
        return;
      }
      
      resolve(decoded);
    });
  });
}

// 获取日活跃用户数据
function getDailyActiveUsers(days = 30) {
  return new Promise((resolve, reject) => {
    // 首先检查表是否存在数据，如果没有数据则返回空数组
    db.get("SELECT COUNT(*) as count FROM user_activity", [], (err, countResult) => {
      if (err) {
        console.error('检查user_activity表时出错:', err);
        reject(err);
        return;
      }
      
      if (countResult.count === 0) {
        // 如果没有活跃度数据，返回空数组
        console.log('user_activity表中暂无数据，返回空的DAU数据');
        resolve([]);
        return;
      }
      
      const query = `
        SELECT 
          DATE(activity_time) as date,
          COUNT(DISTINCT user_id) as active_users
        FROM user_activity 
        WHERE activity_time >= datetime('now', '-${days} days')
        GROUP BY DATE(activity_time)
        ORDER BY date DESC
      `;
      
      db.all(query, [], (err, rows) => {
        if (err) {
          console.error('获取DAU数据时出错:', err);
          reject(err);
          return;
        }
        console.log('成功获取DAU数据:', rows);
        resolve(rows || []);
      });
    });
  });
}

// 获取用户统计数据
function getUserStats() {
  return new Promise((resolve, reject) => {
    const queries = {
      totalUsers: "SELECT COUNT(*) as count FROM users",
      activeUsers: "SELECT COUNT(*) as count FROM users WHERE status = 'active'",
      adminUsers: "SELECT COUNT(*) as count FROM users WHERE role = 'admin'",
      todayRegistrations: "SELECT COUNT(*) as count FROM users WHERE DATE(created_at) = DATE('now')",
      todayActiveUsers: `
        SELECT COALESCE(COUNT(DISTINCT user_id), 0) as count 
        FROM user_activity 
        WHERE DATE(activity_time) = DATE('now')
      `
    };
    
    const results = {};
    const promises = Object.keys(queries).map(key => {
      return new Promise((resolve, reject) => {
        db.get(queries[key], [], (err, row) => {
          if (err) {
            console.error(`获取${key}统计数据时出错:`, err);
            // 如果查询失败，设置默认值为0
            results[key] = 0;
            resolve();
            return;
          }
          results[key] = row ? (row.count || 0) : 0;
          resolve();
        });
      });
    });
    
    Promise.all(promises)
      .then(() => {
        console.log('成功获取用户统计数据:', results);
        resolve(results);
      })
      .catch((err) => {
        console.error('获取用户统计数据时出错:', err);
        // 返回默认值
        resolve({
          totalUsers: 0,
          activeUsers: 0,
          adminUsers: 0,
          todayRegistrations: 0,
          todayActiveUsers: 0
        });
      });
  });
}

// 获取用户列表（支持搜索和筛选）
function getUsersWithFilter(adminId, searchTerm = '', roleFilter = '', statusFilter = '', page = 1, limit = 20) {
  return new Promise((resolve, reject) => {
    // 验证操作者是否为管理员
    db.get("SELECT role FROM users WHERE id = ?", [adminId], (err, admin) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (!admin || admin.role !== 'admin') {
        reject(new Error('权限不足'));
        return;
      }
      
      let whereConditions = [];
      let params = [];
      
      if (searchTerm) {
        whereConditions.push("(username LIKE ? OR email LIKE ?)");
        params.push(`%${searchTerm}%`, `%${searchTerm}%`);
      }
      
      if (roleFilter) {
        whereConditions.push("role = ?");
        params.push(roleFilter);
      }
      
      if (statusFilter) {
        whereConditions.push("status = ?");
        params.push(statusFilter);
      }
      
      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
      const offset = (page - 1) * limit;
      
      // 获取总数
      const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`;
      db.get(countQuery, params, (err, countResult) => {
        if (err) {
          reject(err);
          return;
        }
        
        // 获取用户列表
        const dataQuery = `
          SELECT id, username, email, role, status, created_at, last_login 
          FROM users ${whereClause} 
          ORDER BY created_at DESC 
          LIMIT ? OFFSET ?
        `;
        
        db.all(dataQuery, [...params, limit, offset], (err, users) => {
          if (err) {
            reject(err);
            return;
          }
          
          resolve({
            users,
            total: countResult.total,
            page,
            limit,
            totalPages: Math.ceil(countResult.total / limit)
          });
        });
      });
    });
  });
}

// 获取审计日志
function getAuditLogs(adminId, page = 1, limit = 50) {
  return new Promise((resolve, reject) => {
    // 验证操作者是否为管理员
    db.get("SELECT role FROM users WHERE id = ?", [adminId], (err, admin) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (!admin || admin.role !== 'admin') {
        reject(new Error('权限不足'));
        return;
      }
      
      const offset = (page - 1) * limit;
      
      // 获取总数
      db.get("SELECT COUNT(*) as total FROM audit_logs", [], (err, countResult) => {
        if (err) {
          reject(err);
          return;
        }
        
        // 获取审计日志列表
        const query = `
          SELECT * FROM audit_logs 
          ORDER BY created_at DESC 
          LIMIT ? OFFSET ?
        `;
        
        db.all(query, [limit, offset], (err, logs) => {
          if (err) {
            reject(err);
            return;
          }
          
          resolve({
            logs,
            total: countResult.total,
            page,
            limit,
            totalPages: Math.ceil(countResult.total / limit)
          });
        });
      });
    });
  });
}

// 导出函数
module.exports = {
  initDatabase,
  registerUser,
  loginUser,
  getUserById,
  changePassword,
  resetUserPassword,
  getAllUsers,
  updateUserStatus,
  updateUserRole,
  updateUserInfo,
  verifyToken,
  isIpBlacklisted,
  recordUserActivity,
  recordAuditLog,
  getDailyActiveUsers,
  getUserStats,
  getUsersWithFilter,
  getAuditLogs
};
