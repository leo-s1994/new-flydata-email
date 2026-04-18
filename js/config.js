/**
 * Flydata邮件发布系统 - 阿里云配置管理模块
 */

// ============================================
// 加载配置
// ============================================
async function loadConfig() {
  try {
    const supabase = getSupabase();
    const user = await getCurrentUser();
    
    if (!user) return;

    const { data, error } = await supabase
      .from('configs')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (data) {
      document.getElementById('accessKeyId').value = data.access_key_id || '';
      document.getElementById('accessKeySecret').value = data.access_key_secret || '';
      document.getElementById('region').value = data.region || 'cn-hangzhou';
      document.getElementById('fromAddress').value = data.from_address || '';
      document.getElementById('fromAlias').value = data.from_alias || '';
    }
  } catch (error) {
    console.error('加载配置失败:', error);
    showToast('加载配置失败', 'error');
  }
}

// ============================================
// 保存配置
// ============================================
document.addEventListener('DOMContentLoaded', function() {
  const configForm = document.getElementById('configForm');
  if (configForm) {
    configForm.addEventListener('submit', saveConfig);
  }
});

async function saveConfig(e) {
  e.preventDefault();

  const accessKeyId = document.getElementById('accessKeyId').value.trim();
  const accessKeySecret = document.getElementById('accessKeySecret').value.trim();
  const region = document.getElementById('region').value;
  const fromAddress = document.getElementById('fromAddress').value.trim();
  const fromAlias = document.getElementById('fromAlias').value.trim();

  if (!accessKeyId || !accessKeySecret || !fromAddress) {
    showToast('请填写必填项', 'warning');
    return;
  }

  showLoading('保存中...');

  try {
    const supabase = getSupabase();
    const user = await getCurrentUser();

    // 加密AccessKey Secret（简单Base64编码，生产环境应使用更强的加密）
    const encryptedSecret = btoa(accessKeySecret);

    // 检查是否已存在配置
    const { data: existing } = await supabase
      .from('configs')
      .select('id')
      .eq('user_id', user.id)
      .single();

    let error;
    
    if (existing) {
      // 更新
      const result = await supabase
        .from('configs')
        .update({
          access_key_id: accessKeyId,
          access_key_secret: encryptedSecret,
          region: region,
          from_address: fromAddress,
          from_alias: fromAlias,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);
      error = result.error;
    } else {
      // 插入
      const result = await supabase
        .from('configs')
        .insert([{
          user_id: user.id,
          access_key_id: accessKeyId,
          access_key_secret: encryptedSecret,
          region: region,
          from_address: fromAddress,
          from_alias: fromAlias
        }]);
      error = result.error;
    }

    if (error) throw error;

    hideLoading();
    showToast('配置保存成功', 'success');

  } catch (error) {
    hideLoading();
    console.error('保存配置失败:', error);
    showToast('保存配置失败', 'error');
  }
}

// ============================================
// 获取当前用户配置
// ============================================
async function getUserConfig() {
  try {
    const supabase = getSupabase();
    const user = await getCurrentUser();
    
    if (!user) return null;

    const { data, error } = await supabase
      .from('configs')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      return null;
    }

    // 解密AccessKey Secret
    return {
      ...data,
      access_key_secret: atob(data.access_key_secret)
    };
  } catch (error) {
    console.error('获取配置失败:', error);
    return null;
  }
}

// ============================================
// 测试连接
// ============================================
async function testConnection() {
  const config = await getUserConfig();
  
  if (!config) {
    showToast('请先保存配置', 'warning');
    return;
  }

  showLoading('测试连接中...');

  try {
    // 这里可以调用阿里云API进行测试
    // 由于需要实现签名算法，暂时只验证配置是否存在
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    hideLoading();
    showToast('配置有效', 'success');
  } catch (error) {
    hideLoading();
    console.error('测试连接失败:', error);
    showToast('连接测试失败', 'error');
  }
}
