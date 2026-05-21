import React, { useEffect, useRef, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment, Float, PerspectiveCamera, useGLTF, Html, useProgress } from '@react-three/drei';
import * as fabric from 'fabric'; 
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';

// --- FIXED IMPORTS ---
import { 
  Upload, 
  Box, 
  Settings, 
  Trash2, 
  ZoomIn, 
  Maximize, // <--- Added this
  Image as ImageIcon, 
  X 
} from 'lucide-react';

// --- ASSET IMPORTS ---
import uvTemplateImg from '../assets/uv-template.png';
import roundModelPath from '../assets/model/round.glb?url'; 

// Loading Overlay for 3D Model
function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="bg-white/90 backdrop-blur-md px-8 py-4 rounded-3xl border border-slate-200 shadow-2xl flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">{Math.round(progress)}% Loading Model</span>
      </div>
    </Html>
  );
}

// ==========================================
// 1. 3D ROUND MODEL COMPONENT
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

  return <primitive object={scene} scale={2.8} position={[0, -1, 0]} />;
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

  // Initialize Fabric Canvas
  useEffect(() => {
    const canvas = new fabric.Canvas(canvasElRef.current, {
      backgroundColor: '#ffffff',
      width: 1024,
      height: 1024,
      preserveObjectStacking: true
    });
    fabricRef.current = canvas;

    // Load UV Template
    fabric.Image.fromURL(uvTemplateImg, (img) => {
      img.set({ selectable: false, evented: false, opacity: 0.25 });
      img.scaleToWidth(1024);
      canvas.add(img);
      canvas.sendToBack(img);
      canvas.renderAll();
    }, { crossOrigin: 'anonymous' });

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

  // --- FIXED IMAGE UPLOAD HANDLER ---
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imgData = event.target.result;
      
      // We create a native HTML Image first to ensure it loads before giving it to Fabric
      const imgObj = new Image();
      imgObj.src = imgData;
      
      imgObj.onload = () => {
        const fabricImg = new fabric.Image(imgObj, {
          left: 512, // Center of 1024
          top: 300,  // Near the "Straight Label" area of your UV
          originX: 'center',
          originY: 'center',
          cornerStyle: 'circle',
          cornerColor: '#6366f1',
          transparentCorners: false,
        });

        fabricImg.scaleToWidth(300);
        fabricRef.current.add(fabricImg);
        fabricRef.current.setActiveObject(fabricImg);
        fabricRef.current.renderAll();
        
        // IMPORTANT: Close the modal after successful add
        setIsModalOpen(false);
        // Reset input so the same file can be uploaded again if deleted
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
        <div className="flex flex-col gap-6">
          <ToolBtn icon={ImageIcon} label="Artwork" active={activeTab === 'uploads'} onClick={() => setActiveTab('uploads')} />
          <ToolBtn icon={Settings} label="Material" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </div>
      </aside>

      {/* DRAWER */}
      <div className="w-80 bg-white border-r border-slate-200 p-8 z-40 shrink-0 shadow-sm">
        <header className="mb-8">
            <h2 className="text-2xl font-black tracking-tight capitalize">{activeTab}</h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Packdora Pro Editor</p>
        </header>
        
        {activeTab === 'uploads' && (
          <div className="space-y-4">
            <button 
                onClick={() => setIsModalOpen(true)}
                className="w-full py-12 border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center gap-3 hover:border-indigo-400 hover:bg-indigo-50 transition-all group"
            >
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Upload size={24} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Add New Label</span>
            </button>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                    Upload your logo and place it over the top rectangle for the side wall or the circle for the bottom.
                </p>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Container Color</label>
            <div className="grid grid-cols-4 gap-3">
              {['#ffffff', '#1a1a1a', '#fcd34d', '#60a5fa', '#34d399', '#f87171'].map(c => (
                <button 
                  key={c} onClick={() => setBoxColor(c)} 
                  className={`w-12 h-12 rounded-full border-4 transition-all ${boxColor === c ? 'border-indigo-600 scale-110' : 'border-white shadow-sm hover:scale-105'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* WORKSPACE AREA */}
      <main className="flex-1 relative flex flex-col min-w-0 bg-[#f1f5f9]">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-10 z-30">
            <span className="font-black text-xl tracking-tighter">PACKDORA<span className="text-indigo-600 underline decoration-2 underline-offset-4">ULTRA</span></span>
            <div className="flex gap-4">
                <button className="px-5 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-indigo-600 transition-colors">Export File</button>
            </div>
        </header>

        <div ref={wrapperRef} className="flex-1 flex items-center justify-center p-12 relative">
           <div className="bg-white shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] rounded-3xl overflow-hidden border border-white">
              <canvas ref={canvasElRef} />
           </div>
           
           {/* Floating Canvas Controls */}
           <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-xl px-8 py-4 rounded-full shadow-2xl flex items-center gap-8 border border-white">
              <button 
                onClick={() => fabricRef.current.remove(fabricRef.current.getActiveObject())} 
                className="flex flex-col items-center gap-1 text-slate-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={20}/>
                <span className="text-[8px] font-black uppercase">Delete</span>
              </button>
              <div className="w-px h-6 bg-slate-200" />
              <div className="flex items-center gap-4 text-slate-400">
                <ZoomIn size={20} className="cursor-pointer hover:text-indigo-600" />
                <Maximize size={20} className="cursor-pointer hover:text-indigo-600" />
              </div>
           </div>
        </div>

        {/* 3D FLOATING PREVIEW BOX */}
        <div className="absolute top-24 right-10 w-[480px] h-[480px] pointer-events-none z-40">
          <div className="w-full h-full bg-[#0f172a] rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border-[8px] border-white overflow-hidden pointer-events-auto relative">
             <div className="absolute top-8 left-10 z-10 flex items-center gap-3">
                <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_15px_#22c55e]" />
                <span className="text-white text-[10px] font-black uppercase tracking-[0.3em] opacity-70">Live Rendering</span>
             </div>
             
             <Canvas shadows dpr={[1, 2]}>
               <Suspense fallback={<Loader />}>
                 <PerspectiveCamera makeDefault position={[5, 4, 5]} fov={35} />
                 <ambientLight intensity={0.5} />
                 <spotLight position={[10, 15, 10]} angle={0.3} penumbra={1} intensity={2} castShadow />
                 <Environment preset="studio" />
                 
                 <Float speed={2} rotationIntensity={0.3} floatIntensity={0.5}>
                   {isCanvasReady && <RoundModel canvasElement={canvasElRef.current} boxColor={boxColor} />}
                 </Float>
                 
                 <OrbitControls makeDefault dampingFactor={0.1} />
                 <ContactShadows position={[0, -1, 0]} opacity={0.6} scale={10} blur={2.5} far={10} />
               </Suspense>
             </Canvas>
          </div>
        </div>
      </main>

      {/* UPLOAD MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
                initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} 
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" 
                onClick={()=>setIsModalOpen(false)} 
            />
            <motion.div 
                initial={{scale:0.9, y: 20, opacity:0}} animate={{scale:1, y: 0, opacity:1}} exit={{scale:0.9, y: 20, opacity:0}}
                className="bg-white w-full max-w-lg rounded-[3rem] p-12 relative z-10 shadow-2xl text-center overflow-hidden"
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-8 right-8 text-slate-300 hover:text-slate-600 transition-colors"
              >
                <X size={24} />
              </button>

              <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
                <Upload size={32} />
              </div>
              
              <h3 className="text-3xl font-black mb-2 tracking-tight">Upload Artwork</h3>
              <p className="text-slate-400 text-sm font-medium mb-10">Select a high-quality PNG or JPG file.</p>
              
              <label className="block w-full py-16 border-4 border-dashed border-slate-100 rounded-[2.5rem] cursor-pointer hover:bg-slate-50 hover:border-indigo-200 transition-all group">
                <span className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-200 group-hover:bg-indigo-700 transition-colors">
                  Select File From Device
                </span>
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
              
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="mt-8 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] hover:text-slate-600 transition-colors"
              >
                Go Back
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Sub-component for Sidebar Buttons
function ToolBtn({ icon: Icon, label, active, onClick }) {
  return (
    <button 
        onClick={onClick} 
        className={`flex flex-col items-center gap-2 group transition-all relative ${active ? 'text-indigo-600' : 'text-slate-300 hover:text-slate-500'}`}
    >
      <div className={`p-3.5 rounded-2xl transition-all ${active ? 'bg-indigo-50 shadow-sm' : 'group-hover:bg-slate-50'}`}>
        <Icon size={22} strokeWidth={active ? 2.5 : 2} />
      </div>
      <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
      {active && <div className="absolute -right-5 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-600 rounded-l-full" />}
    </button>
  );
}