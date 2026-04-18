/**
 * Flydata邮件发布系统 - Supabase客户端配置
 * 使用前请在下方填入你的Supabase项目URL和Anon Key
 */

// ============================================
// Supabase配置（请修改为你的实际配置）
// ============================================
const SUPABASE_CONFIG = {
  url: 'https://wsfyrqcvifoxoxdrlglg.supabase.co',      // 👈 改成你的
  anonKey: 'sb_publishable_axTc7eyT6bimh1Nr6Em_wQ_oOkLsQGm'                  // 👈 改成你的
};

// 初始化Supabase客户端
let supabaseClient = null;

/**
 * 获取Supabase客户端实例
 * @returns {object} Supabase客户端
 */
function getSupabase() {
  if (!supabaseClient) {
    if (typeof window.supabase === 'undefined') {
      console.error('Supabase库未加载，请确保已引入supabase-js CDN');
      return null;
    }
    supabaseClient = window.supabase.createClient(
      SUPABASE_CONFIG.url,
      SUPABASE_CONFIG.anonKey
    );
  }
  return supabaseClient;
}

/**
 * 获取当前登录用户
 * @returns {object|null} 当前用户对象或null
 */
async function getCurrentUser() {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * 检查用户是否已登录
 * @returns {boolean}
 */
async function isAuthenticated() {
  const user = await getCurrentUser();
  return user !== null;
}

/**
 * 监听认证状态变化
 * @param {Function} callback - 回调函数 (event, session) => void
 */
function onAuthStateChange(callback) {
  const supabase = getSupabase();
  if (!supabase) return;

  supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getSupabase, getCurrentUser, isAuthenticated, onAuthStateChange };
}
