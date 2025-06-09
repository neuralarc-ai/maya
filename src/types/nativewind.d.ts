/// <reference types="nativewind/types" />

declare module 'nativewind' {
  import type { ComponentProps } from 'react';
  import type { View as RNView, Text as RNText, TouchableOpacity as RNTouchableOpacity } from 'react-native';

  export type StyledComponent<T> = T & {
    className?: string;
  };

  export type ViewProps = ComponentProps<typeof RNView> & { className?: string };
  export type TextProps = ComponentProps<typeof RNText> & { className?: string };
  export type TouchableOpacityProps = ComponentProps<typeof RNTouchableOpacity> & { className?: string };
} 