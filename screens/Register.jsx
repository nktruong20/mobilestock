// screens/Register.jsx
import { Eye, EyeOff, Lock, Mail, TrendingUp, User } from 'lucide-react-native';
import { useState } from 'react';
import {
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
import AwesomeAlert from 'react-native-awesome-alerts';
import { signUp } from '../services/auth';

export default function Register({ navigation }) {
  const [showPassword, setShowPassword] = useState(false);
  const [fullname, setFullname] = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [agree, setAgree]       = useState(false);
  const [loading, setLoading]   = useState(false);

  // Alert state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle]     = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [isSuccess, setIsSuccess]       = useState(false);

  const showAlert = (ok, title, message) => {
    setIsSuccess(ok);
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  const handleRegister = async () => {
    const name = fullname.trim();
    const emailNorm = email.trim().toLowerCase();
    const pwd = password;

    if (!name || !emailNorm || !pwd) {
      return showAlert(false, 'Thiếu thông tin', 'Vui lòng điền đầy đủ họ tên, email và mật khẩu');
    }
    if (pwd.length < 8) {
      return showAlert(false, 'Mật khẩu yếu', 'Mật khẩu phải có ít nhất 8 ký tự');
    }
    if (!agree) {
      return showAlert(false, 'Chưa đồng ý', 'Bạn cần đồng ý Điều khoản sử dụng');
    }

    try {
      if (loading) return; // tránh double tap
      setLoading(true);

      // ✅ Gửi đúng key "name" cho backend
      await signUp({ name, email: emailNorm, password: pwd });

      showAlert(true, 'Đăng ký thành công', 'Chào mừng bạn đến với StockPro!');
    } catch (err) {
      console.log('❌ Lỗi đăng ký:', {
        message: err?.message,
        status: err?.response?.status,
        data: err?.response?.data,
      });

      const backendMsg = err?.response?.data?.message;
      showAlert(false, 'Lỗi đăng ký', backendMsg || err.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  const onConfirm = () => {
    setAlertVisible(false);
    if (isSuccess) {
      navigation.replace('Login');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AwesomeAlert
        show={alertVisible}
        showProgress={false}
        title={alertTitle}
        message={alertMessage}
        closeOnTouchOutside={false}
        closeOnHardwareBackPress={false}
        showConfirmButton={true}
        confirmText="OK"
        confirmButtonColor="#10b981"
        onConfirmPressed={onConfirm}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {/* Logo + Header */}
          <View style={styles.logoSection}>
            <View style={styles.logoCircle}>
              <TrendingUp color="#fff" size={32} />
            </View>
            <Text style={styles.title}>StockPro</Text>
            <Text style={styles.subtitle}>
              Đầu tư thông minh, sinh lời bền vững
            </Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Tạo tài khoản</Text>
            <Text style={styles.cardDesc}>
              Bắt đầu hành trình đầu tư của bạn ngay hôm nay
            </Text>

            {/* Full Name */}
            <View style={styles.field}>
              <Text style={styles.label}>Họ và tên</Text>
              <View style={styles.inputWrapper}>
                <User color="#9ca3af" size={20} style={styles.icon} />
                <TextInput
                  placeholder="Nhập họ và tên"
                  placeholderTextColor="#9ca3af"
                  style={styles.input}
                  value={fullname}
                  onChangeText={setFullname}
                  autoCapitalize="words"
                  editable={!loading}
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrapper}>
                <Mail color="#9ca3af" size={20} style={styles.icon} />
                <TextInput
                  placeholder="example@email.com"
                  placeholderTextColor="#9ca3af"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  editable={!loading}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.field}>
              <Text style={styles.label}>Mật khẩu</Text>
              <View style={styles.inputWrapper}>
                <Lock color="#9ca3af" size={20} style={styles.icon} />
                <TextInput
                  placeholder="Tạo mật khẩu mạnh"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry={!showPassword}
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(v => !v)}
                  style={styles.eyeButton}
                  disabled={loading}
                >
                  {showPassword
                    ? <EyeOff color="#9ca3af" size={20} />
                    : <Eye    color="#9ca3af" size={20} />
                  }
                </TouchableOpacity>
              </View>
              <Text style={styles.hint}>
                Mật khẩu phải có ít nhất 8 ký tự
              </Text>
            </View>

            {/* Terms */}
            <View style={styles.termsRow}>
              <TouchableOpacity
                style={[
                  styles.checkbox,
                  agree && { backgroundColor: '#10b981', borderColor: '#10b981' },
                ]}
                onPress={() => setAgree(v => !v)}
                disabled={loading}
              />
              <Text style={styles.termsText}>
                Tôi đồng ý với <Text style={styles.link}>Điều khoản</Text> và{' '}
                <Text style={styles.link}>Chính sách</Text>
              </Text>
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!agree || loading) && { opacity: 0.6 }
              ]}
              disabled={!agree || loading}
              onPress={handleRegister}
            >
              <Text style={styles.submitText}>
                {loading ? 'Đang xử lý...' : 'Tạo tài khoản'}
              </Text>
            </TouchableOpacity>

            {/* Login Link */}
            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => navigation.navigate('Login')}
              disabled={loading}
            >
              <Text style={styles.loginLinkText}>
                Đã có tài khoản? <Text style={styles.link}>Đăng nhập</Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <Text style={styles.footer}>
            © 2024 StockPro. Tất cả quyền được bảo lưu.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#111827' },
  container: { alignItems: 'center', padding: 16 },
  logoSection: { alignItems: 'center', marginBottom: 24 },
  logoCircle: {
    width: 64, height: 64, borderRadius: 16,
    backgroundColor: '#10b981',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  title:    { fontSize: 24, fontWeight: '700', color: '#fff' },
  subtitle: { color: '#d1d5db', marginTop: 4 },

  card: {
    width: '100%', backgroundColor: 'rgba(31,41,55,0.9)',
    borderRadius: 12, padding: 16,
  },
  cardTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 8, textAlign: 'center' },
  cardDesc:  { color: '#d1d5db', marginBottom: 16, textAlign: 'center' },

  field: { marginBottom: 16 },
  label: { color: '#e5e7eb', marginBottom: 4, fontWeight: '600' },
  inputWrapper: { position: 'relative' },
  icon: { position: 'absolute', left: 12, top: 12 },
  input: {
    height: 48, backgroundColor: '#374151',
    borderRadius: 8, paddingLeft: 44, paddingRight: 44,
    color: '#fff',
  },
  eyeButton: { position: 'absolute', right: 12, top: 12 },
  hint: { color: '#9ca3af', fontSize: 12, marginTop: 4 },

  termsRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  checkbox: {
    width: 20, height: 20, borderWidth: 1,
    borderColor: '#4b5563', borderRadius: 4,
    marginTop: 4, marginRight: 8,
  },
  termsText: { color: '#d1d5db', flex: 1 },
  link: { color: '#10b981' },

  submitButton: {
    backgroundColor: '#10b981', borderRadius: 8,
    height: 48, alignItems: 'center',
    justifyContent: 'center', marginBottom: 16,
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  loginLink: { alignSelf: 'center', marginTop: 8 },
  loginLinkText: { color: '#d1d5db' },

  footer: { color: '#9ca3af', fontSize: 12, marginTop: 24 },
});
