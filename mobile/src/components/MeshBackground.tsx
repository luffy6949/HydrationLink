import React from 'react';
import { View, StyleSheet } from 'react-native';

export const MeshBackground: React.FC = () => {
  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Top Left soft blue glow */}
      <View style={[styles.glow, {
        top: -100,
        left: -100,
        backgroundColor: 'rgba(126, 212, 253, 0.35)', 
      }]} />
      {/* Top Right soft mint glow */}
      <View style={[styles.glow, {
        top: -100,
        right: -100,
        backgroundColor: 'rgba(180, 240, 201, 0.3)', 
      }]} />
      {/* Bottom Center soft blue glow */}
      <View style={[styles.glow, {
        bottom: -150,
        alignSelf: 'center',
        width: 400,
        height: 400,
        borderRadius: 200,
        backgroundColor: 'rgba(192, 232, 255, 0.45)', 
      }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  glow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
  },
});
