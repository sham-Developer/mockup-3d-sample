import React, { useEffect, useRef, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  OrbitControls, ContactShadows, Environment, Float, 
  PerspectiveCamera, useGLTF, Html, useProgress, Center // Added Center
} from '@react-three/drei';
import * as fabric from 'fabric'; 
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, Box, Settings, Trash2, ZoomIn, Maximize, Image as ImageIcon, X 
} from 'lucide-react';

// --- ASSET IMPORTS ---
import uvTemplateImg from '../assets/uv-template.png';
import roundModelPath from '../assets/model/round.glb?url'; 

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="bg-white/90 backdrop-blur-md px-8 py-4 rounded-3xl border border-slate-200 shadow-2xl flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">{Math.round(progress)}% Building 3D</span>
      </div>
    </Html>
  );
}

// ==========================================
// 1. 3D ROUND MODEL COMPONENT (CENTERED)
// ==========================================
const RoundModel = ({ canvasElement, boxColor }) => {
  const { scene } = useGLTF(roundModelPath); 
  const [texture, setTexture] = useState(null);

  useEffect(() => {
    if (canvasElement) {
      const tex = new THREE.CanvasTexture(canvasElement);
      tex.flipY = false; 
      tex.colorSpace = THREE.SRGBColorSpace;
      setTexture(tex);
    }
  }, [canvasElement]);

  useFrame(() => {
    if (texture) texture.needsUpdate = true;
    scene.traverse((child) => {
      if (child.isMesh) {
        child.material.map = texture;
        child.material.color = new THREE.Color(boxColor);
        child.material.roughness = 0.4;
        child.material.metalness = 0.2;
      }
    });
  });

  return (
    /* Center component solves the pivot issue by centering geometry at [0,0,0] */
    <Center top>
      <primitive object={scene} scale={2.5} />
    </Center>
  );
};

// ==========================================
// 2. MAIN APPLICATION
// ==========================================
export default function PackagingEditor() {
  const [activeTab, setActiveTab] = useState('uploads');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [boxColor, setBoxColor] = useState('#ffffff');
  const [isCanvasReady, setIsCanvasReady] = useState(false);

  const fabricRef = useRef(null);
  const canvasElRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const canvas = new fabric.Canvas(canvasElRef.current, {
      backgroundColor: '#ffffff',
      width: 1024,
      height: 1024,
      preserveObjectStacking: true
    });
    fabricRef.current = canvas;

    fabric.Image.fromURL(uvTemplateImg, (img) => {
      img.set({ selectable: false, evented: false, opacity: 0.25 });
      img.scaleToWidth(1024);
      canvas.add(img);
      canvas.sendToBack(img);
      canvas.renderAll();
    });

    const handleResize = () => {
      if (wrapperRef.current) {
        const size = Math.min(wrapperRef.current.clientWidth, wrapperRef.current.clientHeight) - 80;
        canvas.setDimensions({ width: size, height: size });
        canvas.setZoom(size / 1024);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    setIsCanvasReady(true);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.dispose();
    };
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const imgObj = new Image();
      imgObj.src = event.target.result;
      imgObj.onload = () => {
        const fabricImg = new fabric.Image(imgObj, {
          left: 512, top: 300,
          originX: 'center', originY: 'center',
          cornerStyle: 'circle', cornerColor: '#6366f1',
          transparentCorners: false,
        });
        fabricImg.scaleToWidth(300);
        fabricRef.current.add(fabricImg);
        fabricRef.current.setActiveObject(fabricImg);
        fabricRef.current.renderAll();
        setIsModalOpen(false);
        e.target.value = '';
      };
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 bg-[#f8fafc] flex overflow-hidden font-sans antialiased text-slate-900">
      
      {/* SIDEBAR */}
      <aside className="w-20 bg-white border-r border-slate-200 flex flex-col items-center py-8 z-50 shadow-xl">
        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mb-10 shadow-lg shadow-indigo-200">
            <Box size={24} strokeWidth={2.5}/>
        </div>
        <ToolBtn icon={ImageIcon} label="Artwork" active={activeTab === 'uploads'} onClick={() => setActiveTab('uploads')} />
        <ToolBtn icon={Settings} label="Material" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
      </aside>

      {/* DRAWER */}
      <div className="w-80 bg-white border-r border-slate-200 p-8 z-40 shrink-0">
        <h2 className="text-2xl font-black tracking-tight capitalize mb-8">{activeTab}</h2>
        
        {activeTab === 'uploads' && (
          <button onClick={() => setIsModalOpen(true)} className="w-full py-12 border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center gap-3 hover:border-indigo-400 hover:bg-indigo-50 transition-all">
             <Upload size={24} className="text-indigo-600" />
             <span className="text-[10px] font-black uppercase text-slate-500">Upload Logo</span>
          </button>
        )}

        {activeTab === 'settings' && (
          <div className="grid grid-cols-4 gap-3">
            {['#ffffff', '#1a1a1a', '#fcd34d', '#60a5fa', '#34d399'].map(c => (
              <button key={c} onClick={() => setBoxColor(c)} className={`w-12 h-12 rounded-full border-4 transition-all ${boxColor === c ? 'border-indigo-600 scale-110' : 'border-white shadow-sm'}`} style={{ backgroundColor: c }} />
            ))}
          </div>
        )}
      </div>

      {/* WORKSPACE AREA */}
      <main className="flex-1 relative flex flex-col min-w-0 bg-[#f1f5f9]">
        <div ref={wrapperRef} className="flex-1 flex items-center justify-center p-12 relative">
           <div className="bg-white shadow-2xl rounded-3xl overflow-hidden">
              <canvas ref={canvasElRef} />
           </div>
           
           <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-xl px-8 py-4 rounded-full shadow-2xl flex items-center gap-8 border border-white">
              <button onClick={() => fabricRef.current.remove(fabricRef.current.getActiveObject())} className="text-slate-400 hover:text-red-500 transition-colors">
                <Trash2 size={20}/>
              </button>
           </div>
        </div>

        {/* 3D FLOATING PREVIEW BOX */}
        <div className="absolute top-10 right-10 w-[500px] h-[500px] pointer-events-none z-40">
          <div className="w-full h-full bg-[#0f172a] rounded-[3.5rem] shadow-2xl border-[8px] border-white overflow-hidden pointer-events-auto relative">
             <Canvas shadows dpr={[1, 2]}>
               <Suspense fallback={<Loader />}>
                 {/* Position camera a bit further back to allow space for rotation */}
                 <PerspectiveCamera makeDefault position={[5, 4, 6]} fov={35} />
                 
                 <ambientLight intensity={0.5} />
                 <spotLight position={[10, 15, 10]} angle={0.3} intensity={2} castShadow />
                 <Environment preset="studio" />
                 
                 <Float speed={1} rotationIntensity={0.2} floatIntensity={0.2}>
                   {isCanvasReady && <RoundModel canvasElement={canvasElRef.current} boxColor={boxColor} />}
                 </Float>
                 
                 {/* OrbitControls now rotates around the re-centered model at [0,0,0] */}
                 <OrbitControls 
                    makeDefault 
                    minPolarAngle={0} 
                    maxPolarAngle={Math.PI} 
                    enablePan={false} 
                    dampingFactor={0.1} 
                 />
                 
                 <ContactShadows position={[0, -0.5, 0]} opacity={0.5} scale={10} blur={2} far={10} />
               </Suspense>
             </Canvas>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md">
            <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} className="bg-white w-full max-w-lg rounded-[3rem] p-12 relative shadow-2xl text-center">
              <h3 className="text-3xl font-black mb-8">Upload Artwork</h3>
              <label className="block w-full py-16 border-4 border-dashed border-slate-100 rounded-[2.5rem] cursor-pointer hover:bg-slate-50 transition-all">
                <span className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest">Select File</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
              <button onClick={() => setIsModalOpen(false)} className="mt-8 text-slate-400 font-bold uppercase text-[10px]">Cancel</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ToolBtn({ icon: Icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-2 group mb-6 ${active ? 'text-indigo-600' : 'text-slate-300'}`}>
      <div className={`p-3.5 rounded-2xl transition-all ${active ? 'bg-indigo-50 shadow-sm' : ''}`}>
        <Icon size={22} />
      </div>
      <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );
}