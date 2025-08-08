// screens/Register.jsx
import { Eye, EyeOff, Lock, Mail, TrendingUp, User } from 'lucide-react-native';
import { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { signUp } from '../services/auth';

export default function Register({ navigation }) {
  const [showPassword, setShowPassword] = useState(false);
  const [fullname, setFullname] = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [agree, setAgree]       = useState(false);
  const [loading, setLoading]   = useState(false);

  const handleRegister = async () => {
    if (!fullname || !email || !password) {
      return Alert.alert('Thông báo', 'Vui lòng điền đầy đủ thông tin');
    }
    if (password.length < 8) {
      return Alert.alert('Thông báo', 'Mật khẩu phải ít nhất 8 ký tự');
    }
    if (!agree) {
      return Alert.alert('Thông báo', 'Bạn cần đồng ý Điều khoản sử dụng');
    }
    try {
      setLoading(true);
      await signUp({ fullname, email, password });
      Alert.alert('Thành công', 'Đăng ký thành công!');
      navigation.replace('Login');
    } catch (err) {
      console.error(err);
      Alert.alert('Lỗi', err.response?.data?.msg || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>

        {/* Logo + Header */}
        <View style={styles.logoSection}>
          <View style={styles.logoCircle}>
            <TrendingUp color="#fff" size={32} />
          </View>
          <Text style={styles.title}>StockPro</Text>
          <Text style={styles.subtitle}>Đầu tư thông minh, sinh lời bền vững</Text>
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
                placeholder="Nhập họ và tên của bạn"
                placeholderTextColor="#9ca3af"
                style={styles.input}
                value={fullname}
                onChangeText={setFullname}
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
                style={styles.input}
                value={email}
                onChangeText={setEmail}
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
              />
              <TouchableOpacity
                onPress={() => setShowPassword(v => !v)}
                style={styles.eyeButton}
              >
                {showPassword
                  ? <EyeOff color="#9ca3af" size={20} />
                  : <Eye    color="#9ca3af" size={20} />
                }
              </TouchableOpacity>
            </View>
            <Text style={styles.hint}>
              Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số
            </Text>
          </View>

          {/* Terms */}
          <View style={styles.termsRow}>
            <TouchableOpacity
              style={[
                styles.checkbox,
                agree && { backgroundColor: '#10b981', borderColor: '#10b981' },
              ]}
              onPress={() => setAgree(!agree)}
            />
            <Text style={styles.termsText}>
              Tôi đồng ý với{' '}
              <Text style={styles.link}>Điều khoản sử dụng</Text> và{' '}
              <Text style={styles.link}>Chính sách bảo mật</Text>
            </Text>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitButton, (!agree || loading) && { opacity: 0.6 }]}
            disabled={!agree || loading}
            onPress={handleRegister}
          >
            <Text style={styles.submitText}>
              {loading ? 'Đang xử lý...' : 'Tạo tài khoản'}
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Hoặc</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Login Link */}
          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginLinkText}>
              Đã có tài khoản? <Text style={styles.link}>Đăng nhập ngay</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>© 2024 StockPro. Tất cả quyền được bảo lưu.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#111827' },
  container: {
    alignItems: 'center',
    padding: 16,
  },
  logoSection: { alignItems: 'center', marginBottom: 24 },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title:    { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 4 },
  subtitle: { color: '#d1d5db' },

  card: {
    width: '100%',
    backgroundColor: 'rgba(31,41,55,0.9)',
    borderRadius: 12,
    padding: 16,
  },
  cardTitle: { fontSize: 20, fontWeight: '700', color: '#fff', textAlign: 'center' },
  cardDesc:  { color: '#d1d5db', textAlign: 'center', marginBottom: 16 },

  field: { marginBottom: 16 },
  label: { color: '#e5e7eb', marginBottom: 4, fontWeight: '600' },
  inputWrapper: { position: 'relative' },
  icon: { position: 'absolute', left: 12, top: 12 },
  input: {
    height: 48,
    backgroundColor: '#374151',
    borderRadius: 8,
    paddingLeft: 44,
    paddingRight: 44,
    color: '#fff',
  },
  eyeButton: { position: 'absolute', right: 12, top: 12 },

  hint: { color: '#9ca3af', fontSize: 12, marginTop: 4 },

  termsRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#4b5563',
    borderRadius: 4,
    marginTop: 4,
    marginRight: 8,
  },
  termsText: { color: '#d1d5db', flex: 1 },
  link: { color: '#10b981' },

  submitButton: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  submitText: { color: '#fff', fontWeight: '600', fontSize: 16 },

  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#4b5563' },
  dividerText: { marginHorizontal: 8, color: '#9ca3af' },

  loginLink: {
    alignSelf: 'center',
    marginTop: 12,
  },
  loginLinkText: { color: '#d1d5db', textAlign: 'center' },

  footer: { color: '#9ca3af', fontSize: 12, marginTop: 24 },
});
