import { useLayoutEffect, useMemo, useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { gsap } from 'gsap';
import { FrontSide, type Group, type OrthographicCamera } from 'three';
import { createPageTexture } from './textures';
import type { StoryPage } from '../data/story';

const PAGE_W = 4.8;
const PAGE_H = 3.28;

interface BookProps {
  pages: readonly StoryPage[];
  current: number;
  turningIndex: number | null;
  reducedMotion: boolean;
  onTurnFinished: (index: number) => void;
}

function ResponsiveCamera() {
  const { camera, size } = useThree();
  useLayoutEffect(() => {
    const ortho = camera as OrthographicCamera;
    const compact = size.width < 680;
    // Desktop frames both leaves. Phones emphasize the readable right page,
    // leaving just enough of the binding/left stack visible for page-turn cues.
    ortho.zoom = Math.min(
      size.width / (compact ? 6.65 : 11.6),
      size.height / (compact ? 4.2 : 4.8),
    );
    ortho.position.x = compact ? 1.55 : 0;
    ortho.updateProjectionMatrix();
  }, [camera, size.width, size.height]);
  return null;
}

function PaperLeaf({
  page, index, total, turned, turning, reducedMotion, onTurnFinished,
}: {
  page: StoryPage;
  index: number;
  total: number;
  turned: boolean;
  turning: boolean;
  reducedMotion: boolean;
  onTurnFinished: (index: number) => void;
}) {
  const pivot = useRef<Group>(null);
  const previous = useRef<boolean | null>(null);
  const textures = useMemo(() => ({
    background: createPageTexture(page, 'background'),
    art: createPageTexture(page, 'art'),
    foreground: createPageTexture(page, 'foreground'),
    back: createPageTexture(page, 'back'),
  }), [page]);

  useEffect(() => () => {
    Object.values(textures).forEach((texture) => texture.dispose());
  }, [textures]);

  useLayoutEffect(() => {
    const group = pivot.current;
    if (!group) return;
    if (previous.current === null) {
      group.rotation.y = turned ? -Math.PI : 0;
      previous.current = turned;
      return;
    }
    if (previous.current === turned) return;
    previous.current = turned;
    const destination = turned ? -Math.PI : 0;
    if (reducedMotion) {
      group.rotation.y = destination;
      onTurnFinished(index);
      return;
    }
    const tween = gsap.to(group.rotation, {
      y: destination,
      duration: 1.2,
      ease: 'power2.inOut',
      onComplete: () => onTurnFinished(index),
    });
    return () => { tween.kill(); };
  }, [index, turned, reducedMotion, onTurnFinished]);

  // Pages to the right are ordered cover-first; those on the left stack in
  // the opposite direction. Give the moving leaf temporary front priority.
  const depth = turning ? 0.78 : turned ? 0.03 + index * 0.12 : 0.03 + (total - index) * 0.12;

  return (
    <group ref={pivot} position={[0, 0, depth]}>
      <mesh position={[PAGE_W / 2, 0, 0]}>
        <planeGeometry args={[PAGE_W, PAGE_H]} />
        <meshBasicMaterial map={textures.background} side={FrontSide} />
      </mesh>
      <mesh position={[PAGE_W / 2, 0, 0.028]}>
        <planeGeometry args={[PAGE_W, PAGE_H]} />
        <meshBasicMaterial map={textures.art} transparent depthWrite={false} side={FrontSide} />
      </mesh>
      <mesh position={[PAGE_W / 2, 0, 0.055]}>
        <planeGeometry args={[PAGE_W, PAGE_H]} />
        <meshBasicMaterial map={textures.foreground} transparent depthWrite={false} side={FrontSide} />
      </mesh>
      <mesh position={[PAGE_W / 2, 0, -0.008]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[PAGE_W, PAGE_H]} />
        <meshBasicMaterial map={textures.back} side={FrontSide} />
      </mesh>
    </group>
  );
}

function BookStage(props: BookProps) {
  return (
    <>
      <color attach="background" args={['#151722']} />
      <ResponsiveCamera />
      <ambientLight intensity={1.3} />
      <mesh position={[0, -PAGE_H / 2 - 0.13, -0.15]}>
        <boxGeometry args={[0.075, 0.18, 0.18]} />
        <meshStandardMaterial color="#a5837a" roughness={0.85} />
      </mesh>
      {props.pages.map((page, index) => (
        <PaperLeaf
          key={page.id}
          page={page}
          index={index}
          total={props.pages.length}
          turned={index < props.current}
          turning={index === props.turningIndex}
          reducedMotion={props.reducedMotion}
          onTurnFinished={props.onTurnFinished}
        />
      ))}
    </>
  );
}

export function Storybook3D(props: BookProps) {
  return (
    <Canvas
      orthographic
      camera={{ position: [0, 0, 16], zoom: 65, near: 0.1, far: 100 }}
      dpr={[1, 1.75]}
      gl={{ alpha: false, antialias: true }}
      aria-label="可交互三维立体绘本"
    >
      <BookStage {...props} />
    </Canvas>
  );
}
