// components/BottomNav.js
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function BottomNav({ activeRoute }) {
  const navigation = useNavigation();

  const items = [
    { name: 'Dashboard', icon: <Ionicons name="home" size={24} />, label: 'Trang chủ' },
    { name: 'Market',    icon: <MaterialCommunityIcons name="chart-line" size={24} />, label: 'Thị trường' },
    { name: 'News',      icon: <Ionicons name="newspaper-outline" size={24} />, label: 'Tin tức' },
    { name: 'Account',   icon: <Ionicons name="person-outline" size={24} />, label: 'Tài khoản' },
  ];

  return (
    <View style={styles.container}>
      {items.map(item => {
        const isActive = item.name === activeRoute;
        return (
          <TouchableOpacity
            key={item.name}
            style={styles.button}
            onPress={() => navigation.navigate(item.name)}
          >
            {React.cloneElement(item.icon, { color: isActive ? '#3b82f6' : '#888' })}
            <Text style={[styles.label, isActive && styles.activeLabel]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#333',
    backgroundColor: '#1a1a1a',
    paddingVertical: 8,
    justifyContent: 'space-around',
  },
  button: { alignItems: 'center' },
  label: { fontSize: 10, color: '#888', marginTop: 4 },
  activeLabel: { color: '#3b82f6' },
});
