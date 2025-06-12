import React, { useMemo, useEffect, useRef, useState } from 'react';
import { Platform, View, Pressable, TouchableOpacity } from 'react-native';
import { Mic } from 'lucide-react-native';
import {
  Canvas,
  Path,
  Paint,
  BlurMask,
  vec,
  Skia,
  Group,
} from '@shopify/react-native-skia';

const ORB_SIZE = 200;
const POINTS = 8;
const RING_RADIUS = 90;
const RING_WIDTH = 12;
const FRAGMENT_COLORS = ["#97A487", "#9A7D70", "#A8B0B8", "#97A487", "#9A7D70", "#A8B0B8"];
const FRAGMENT_COUNT = 6;
const FRAGMENT_SWEEP = 32; // degrees per fragment
const FRAGMENT_GAP = 28; // degrees between fragments
const FRAGMENT_WIDTH = 18;

export function AnimatedMic({ listening, onPress }: { listening: boolean; onPress?: () => void }) {
  if (Platform.OS === 'web') {
    // Fallback: animated SVG orb and ring for web
    return (
      <Pressable onPress={onPress} style={{ width: ORB_SIZE, height: ORB_SIZE, alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        {/* Animated rotating arc fragments */}
        {listening && (
          <svg
            width={ORB_SIZE}
            height={ORB_SIZE}
            style={{ position: 'absolute', left: 0, top: 0, animation: 'orb-rotate 2s linear infinite', zIndex: 2 }}
          >
            {Array.from({ length: FRAGMENT_COUNT }).map((_, i) => {
              const angle = (i * (FRAGMENT_SWEEP + FRAGMENT_GAP)) - 90;
              const color = FRAGMENT_COLORS[i % FRAGMENT_COLORS.length];
              const r = RING_RADIUS;
              const startAngle = (angle * Math.PI) / 180;
              const endAngle = ((angle + FRAGMENT_SWEEP) * Math.PI) / 180;
              const x1 = ORB_SIZE / 2 + r * Math.cos(startAngle);
              const y1 = ORB_SIZE / 2 + r * Math.sin(startAngle);
              const x2 = ORB_SIZE / 2 + r * Math.cos(endAngle);
              const y2 = ORB_SIZE / 2 + r * Math.sin(endAngle);
              const largeArcFlag = FRAGMENT_SWEEP > 180 ? 1 : 0;
              return (
                <path
                  key={i}
                  d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2}`}
                  stroke={color}
                  strokeWidth={FRAGMENT_WIDTH}
                  strokeLinecap="round"
                  fill="none"
                  style={{ filter: 'blur(1.5px)' }}
                />
              );
            })}
          </svg>
        )}
        {/* Orb */}
        <svg
          width={ORB_SIZE}
          height={ORB_SIZE}
          style={{ position: 'absolute', left: 0, top: 0 }}
        >
          <defs>
            <radialGradient id="orb" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#B7BEAE" stopOpacity="0.8" />
              <stop offset="70%" stopColor="#2B2521" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#B7A694" stopOpacity="0.1" />
            </radialGradient>
          </defs>
          <circle cx={ORB_SIZE/2} cy={ORB_SIZE/2} r={80} fill="url(#orb)" />
          <filter id="blur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="12" />
          </filter>
        </svg>
        <View style={{
          position: 'absolute',
          left: 0, top: 0, width: ORB_SIZE, height: ORB_SIZE,
          alignItems: 'center', justifyContent: 'center',
          zIndex: 3,
        }}>
          <Mic size={48} color="#fff" />
        </View>
      </Pressable>
    );
  }

  // Native: Skia animated orb and rotating arc fragments
  const [t, setT] = useState(0);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    let start = Date.now();
    function animate() {
      setT(((Date.now() - start) / (listening ? 800 : 2500)));
      animRef.current = requestAnimationFrame(animate);
    }
    animate();
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return undefined;
    };
  }, [listening]);

  const center = useMemo(() => vec(ORB_SIZE / 2, ORB_SIZE / 2), []);
  const rotation = useMemo(() => (t * 2 * Math.PI) % (2 * Math.PI), [t, listening]);

  function getArcFragmentPath(startDeg: number, sweepDeg: number) {
    const r = RING_RADIUS;
    const startRad = (startDeg * Math.PI) / 180;
    const endRad = ((startDeg + sweepDeg) * Math.PI) / 180;
    const x1 = ORB_SIZE / 2 + r * Math.cos(startRad);
    const y1 = ORB_SIZE / 2 + r * Math.sin(startRad);
    const x2 = ORB_SIZE / 2 + r * Math.cos(endRad);
    const y2 = ORB_SIZE / 2 + r * Math.sin(endRad);
    const largeArcFlag = sweepDeg > 180;
    const sweepFlag = true;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const path = Skia.Path.Make();
    path.moveTo(x1, y1);
    path.rArcTo(r, r, 0, largeArcFlag, sweepFlag, dx, dy);
    return path;
  }

  function getOrbPath(t: number) {
    const radius = 80;
    const points = [];
    for (let i = 0; i < POINTS; i++) {
      const angle = (2 * Math.PI * i) / POINTS;
      const wave = Math.sin(angle * 3 + t) * 18 + Math.cos(angle * 2.5 + t * 1.5) * 8;
      const r = radius + wave;
      const x = ORB_SIZE / 2 + r * Math.cos(angle);
      const y = ORB_SIZE / 2 + r * Math.sin(angle);
      points.push({ x, y });
    }
    const path = Skia.Path.Make();
    path.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      path.lineTo(points[i].x, points[i].y);
    }
    path.close();
    return path;
  }

  const path = useMemo(() => getOrbPath(t), [t]);

  return (
    <View style={{ width: ORB_SIZE, height: ORB_SIZE, alignItems: 'center', justifyContent: 'center' }}>
      <Canvas style={{ width: ORB_SIZE, height: ORB_SIZE }}>
        {/* Rotating arc fragments when listening */}
        {listening && (
          <Group origin={center} transform={[{ rotate: rotation }] }>
            {Array.from({ length: FRAGMENT_COUNT }).map((_, i) => {
              const angle = (i * (FRAGMENT_SWEEP + FRAGMENT_GAP)) - 90;
              const color = FRAGMENT_COLORS[i % FRAGMENT_COLORS.length];
              return (
                <Path
                  key={i}
                  path={getArcFragmentPath(angle, FRAGMENT_SWEEP)}
                  style="stroke"
                  strokeWidth={FRAGMENT_WIDTH}
                  color={Skia.Color(color)}
                  strokeCap="round"
                >
                  <Paint>
                    <BlurMask blur={4} style="normal" />
                  </Paint>
                </Path>
              );
            })}
          </Group>
        )}
        {/* Orb */}
        <Group>
          {/* Outer Glow */}
          <Path path={path} style="stroke" strokeWidth={18} color={Skia.Color('#B7BEAE')}>
            <Paint>
              <BlurMask blur={48} style="normal" />
            </Paint>
          </Path>
          {/* Inner Orb */}
          <Path path={path} style="fill" color={Skia.Color('#2B2521')}>
            <Paint>
              <BlurMask blur={32} style="normal" />
            </Paint>
          </Path>
        </Group>
      </Canvas>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: ORB_SIZE,
          height: ORB_SIZE,
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 3,
        }}
      >
        <Mic size={48} color="#fff" />
      </TouchableOpacity>
    </View>
  );
} 