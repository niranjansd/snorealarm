// Web-specific Slider implementation using HTML input range
import React from 'react';
import {View, StyleSheet} from 'react-native';

interface SliderProps {
  value?: number;
  minimumValue?: number;
  maximumValue?: number;
  step?: number;
  onValueChange?: (value: number) => void;
  minimumTrackTintColor?: string;
  maximumTrackTintColor?: string;
  thumbTintColor?: string;
  style?: object;
}

const Slider: React.FC<SliderProps> = ({
  value = 0,
  minimumValue = 0,
  maximumValue = 1,
  step = 0.1,
  onValueChange,
  minimumTrackTintColor = '#007AFF',
  maximumTrackTintColor = '#E0E0E0',
  thumbTintColor = '#007AFF',
  style,
}) => {
  const percentage = ((value - minimumValue) / (maximumValue - minimumValue)) * 100;

  return (
    <View style={[styles.container, style]}>
      <input
        type="range"
        min={minimumValue}
        max={maximumValue}
        step={step}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onValueChange?.(parseFloat(e.target.value))}
        style={{
          width: '100%',
          height: 40,
          WebkitAppearance: 'none',
          appearance: 'none',
          background: `linear-gradient(to right, ${minimumTrackTintColor} 0%, ${minimumTrackTintColor} ${percentage}%, ${maximumTrackTintColor} ${percentage}%, ${maximumTrackTintColor} 100%)`,
          borderRadius: 5,
          outline: 'none',
          cursor: 'pointer',
          // @ts-ignore - CSS custom properties for thumb styling
          '--thumb-color': thumbTintColor,
        }}
      />
      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: ${thumbTintColor};
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: ${thumbTintColor};
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      `}</style>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 40,
  },
});

export default Slider;
