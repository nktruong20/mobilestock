// screens/Login.js
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  TrendingUp
} from 'lucide-react-native';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { logIn } from '../services/auth';

export default function Login({ navigation }) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading]   = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      return Alert.alert('Thông báo', 'Vui lòng nhập email và mật khẩu');
    }
    try {
      setLoading(true);
      await logIn({ email, password });
      navigation.replace('Dashboard');
    } catch (err) {
      console.error(err);
      Alert.alert('Lỗi', err.response?.data?.msg || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.page}>
      <KeyboardAvoidingView
        style={styles.wrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.loginHeader}>
            <View style={styles.logoCircle}>
              <TrendingUp color="#fff" size={32} />
            </View>
            <Text style={styles.siteTitle}>StockPro</Text>
            <Text style={styles.siteSubtitle}>Chào mừng trở lại!</Text>
          </View>

          {/* Card */}
          <View style={styles.loginCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Đăng nhập</Text>
              <Text style={styles.cardSubtitle}>
                Tiếp tục hành trình đầu tư của bạn
              </Text>
            </View>

            <View style={styles.cardContent}>
              {/* Email */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputRow}>
                  <Mail color="#9ca3af" size={20} />
                  <TextInput
                    style={styles.input}
                    placeholder="example@email.com"
                    placeholderTextColor="#6b7280"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Mật khẩu</Text>
                <View style={styles.inputRow}>
                  <Lock color="#9ca3af" size={20} />
                  <TextInput
                    style={styles.input}
                    placeholder="Nhập mật khẩu của bạn"
                    placeholderTextColor="#6b7280"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(v => !v)}>
                    {showPassword ? (
                      <EyeOff color="#9ca3af" size={20} />
                    ) : (
                      <Eye color="#9ca3af" size={20} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Remember + Forgot */}
              <View style={styles.rememberRow}>
                <TouchableOpacity
                  style={[styles.checkbox, remember && { backgroundColor: '#10b981', borderColor: '#10b981' }]}
                  onPress={() => setRemember(v => !v)}
                />
                <Text style={styles.rememberText}>Ghi nhớ đăng nhập</Text>
                <View style={styles.rememberSpacer} />
                <TouchableOpacity>
                  <Text style={styles.forgotLink}>Quên mật khẩu?</Text>
                </TouchableOpacity>
              </View>

              {/* Login Button */}
              <TouchableOpacity
                style={[styles.btn, loading && { opacity: 0.6 }]}
                disabled={loading}
                onPress={handleLogin}
              >
                <Text style={styles.btnText}>
                  {loading ? 'Đang xử lý...' : 'Đăng nhập'}
                </Text>
              </TouchableOpacity>

              {/* Alt Button */}
              <TouchableOpacity
                style={styles.altButton}
                onPress={() => navigation.replace('Dashboard')}
              >
                <Text style={styles.altButtonText}>Vào Dashboard</Text>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider}>
                <Text style={styles.dividerText}>Hoặc</Text>
              </View>

              {/* Switch to Register */}
              <View style={styles.switchRow}>
                <Text style={styles.switchText}>Chưa có tài khoản? </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Register')}
                >
                  <Text style={styles.switchLink}>Đăng ký ngay</Text>
                </TouchableOpacity>
              </View>

              {/* Notice */}
              <View style={styles.notice}>
                <TrendingUp color="#10b981" size={20} />
                <View style={styles.noticeBody}>
                  <Text style={styles.noticeTitle}>Bảo mật cao</Text>
                  <Text style={styles.noticeText}>
                    Thông tin của bạn được mã hóa và bảo vệ bằng công nghệ hàng đầu.
                  </Text>
                </View>
              </View>

              {/* Footer */}
              <Text style={styles.footer}>
                © 2024 StockPro. Tất cả quyền được bảo lưu.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#111827' },
  wrapper: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 16, justifyContent: 'center' },

  loginHeader: { alignItems: 'center', marginBottom: 32 },
  logoCircle: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: '#10b981', alignItems: 'center',
    justifyContent: 'center', marginBottom: 8, elevation: 5,
  },
  siteTitle: {
    fontSize: 32, fontWeight: '700',
    color: '#fff', marginBottom: 4,
  },
  siteSubtitle: { color: '#d1d5db', fontSize: 14 },

  loginCard: {
    backgroundColor: 'rgba(31,41,55,0.9)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
    elevation: 6,
  },
  cardHeader: {
    paddingVertical: 24,
    alignItems: 'center',
    backgroundColor: '#1f2937',
  },
  cardTitle: {
    color: '#fff', fontSize: 24,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: '#9ca3af', marginTop: 4,
    fontSize: 14,
  },
  cardContent: { padding: 16 },

  formGroup: { marginBottom: 20 },
  label: {
    color: '#e5e7eb', fontSize: 14,
    fontWeight: '600', marginBottom: 8,
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderWidth: 1,
    borderColor: '#4b5563',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1, height: 48,
    marginLeft: 8,
    color: '#fff',
    fontSize: 16,
  },

  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkbox: {
    width: 20, height: 20,
    backgroundColor: '#374151',
    borderWidth: 1,
    borderColor: '#4b5563',
    borderRadius: 4,
  },
  rememberText: {
    color: '#d1d5db', fontSize: 14,
    marginLeft: 8,
  },
  rememberSpacer: {
    flex: 1,
  },
  forgotLink: {
    color: '#10b981',
    fontSize: 14,
  },

  btn: {
    flexDirection: 'row',
    height: 48,
    backgroundColor: '#10b981',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },

  altButton: {
    height: 48,
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  altButtonText: {
    color: '#10b981',
    fontWeight: '600',
    fontSize: 16,
  },

  divider: {
    marginBottom: 24,
    alignItems: 'center',
  },
  dividerText: {
    paddingHorizontal: 8,
    backgroundColor: 'rgba(31,41,55,0.9)',
    color: '#9ca3af',
    fontSize: 14,
  },

  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  switchText: {
    color: '#d1d5db',
    fontSize: 14,
  },
  switchLink: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '600',
  },

  notice: {
    flexDirection: 'row',
    backgroundColor: 'rgba(31,41,55,0.5)',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    padding: 12,
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  noticeBody: {
    marginLeft: 12,
    flex: 1,
  },
  noticeTitle: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 4,
    fontWeight: '600',
  },
  noticeText: {
    color: '#9ca3af',
    fontSize: 12,
  },

  footer: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 12,
    marginBottom: 16,
  },
});
