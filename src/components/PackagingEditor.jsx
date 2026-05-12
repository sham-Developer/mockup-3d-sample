import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment, Float, PerspectiveCamera } from '@react-three/drei';
import * as fabric from 'fabric'; 
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, Box, Image as ImageIcon, Settings, X, Layers, 
  MousePointer2, Type, Square, Download, Eye, Trash2, 
  Maximize, ZoomIn, Grid3X3, Ruler
} from 'lucide-react';

// ==========================================
// 1. 3D BOX COMPONENT
// ==========================================
const BoxModel = ({ canvasElement, openValue, boxColor }) => {
  const lidRef = useRef();
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
    if (lidRef.current) {
      lidRef.current.rotation.x = -openValue * Math.PI * 0.75;
    }
  });

  return (
    <group rotation={[0.1, -Math.PI / 4, 0]}>
      <mesh castShadow>
        <boxGeometry args={[3, 1.8, 2]} />
        <meshStandardMaterial map={texture} color={boxColor} roughness={0.4} metalness={0.1} />
      </mesh>
      <group ref={lidRef} position={[0, 0.9, -1]}>
        <mesh position={[0, 0, 1]} castShadow>
          <boxGeometry args={[3.05, 0.1, 2.05]} />
          <meshStandardMaterial map={texture} color={boxColor} roughness={0.4} />
        </mesh>
      </group>
    </group>
  );
};

// ==========================================
// 2. MAIN APPLICATION
// ==========================================
export default function PackdoraUltimate() {
  const [activeTab, setActiveTab] = useState('uploads');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openAmount, setOpenAmount] = useState(0);
  const [boxColor, setBoxColor] = useState('#ffffff'); // Default White
  const [isCanvasReady, setIsCanvasReady] = useState(false);

  const fabricRef = useRef(null);
  const canvasElRef = useRef(null);
  const wrapperRef = useRef(null);

  // --- Initialize Large Design Artboard ---
  useEffect(() => {
    const canvas = new fabric.Canvas(canvasElRef.current, {
      backgroundColor: 'transparent', // Transparent to see the CSS grid behind
      preserveObjectStacking: true,
      selectionColor: 'rgba(99, 102, 241, 0.1)',
      selectionBorderColor: '#6366f1',
      selectionLineWidth: 2
    });
    fabricRef.current = canvas;

    // Create the "Big Artboard" (Dieline)
    const artboard = new fabric.Rect({
      width: 1200, // Large physical width
      height: 800,
      fill: '#ffffff',
      stroke: '#e2e8f0',
      selectable: false,
      evented: false,
      shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.1)', blur: 50, offsetX: 0, offsetY: 20 })
    });

    // Add visual Dieline lines inside artboard
    const innerDieline = new fabric.Rect({
      left: 100, top: 100, width: 1000, height: 600,
      fill: 'transparent', stroke: '#94a3b8', strokeDashArray: [8, 8],
      selectable: false, evented: false, rx: 20, ry: 20
    });

    canvas.add(artboard);
    canvas.add(innerDieline);
    canvas.centerObject(artboard);
    canvas.centerObject(innerDieline);

    const handleResize = () => {
      if (wrapperRef.current) {
        canvas.setDimensions({ 
          width: wrapperRef.current.clientWidth, 
          height: wrapperRef.current.clientHeight 
        });
        canvas.renderAll();
      }
    };

    const ro = new ResizeObserver(handleResize);
    ro.observe(wrapperRef.current);
    setIsCanvasReady(true);

    return () => {
      ro.disconnect();
      canvas.dispose();
      fabricRef.current = null;
    };
  }, []);

  // --- Add Image Logic ---
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imgObj = new Image();
      imgObj.src = event.target.result;
      imgObj.onload = () => {
        const fabricImg = new fabric.Image(imgObj, {
          left: wrapperRef.current.clientWidth / 2 - 150,
          top: wrapperRef.current.clientHeight / 2 - 150,
          cornerStyle: 'circle',
          cornerColor: '#6366f1',
          transparentCorners: false,
        });
        fabricImg.scaleToWidth(300);
        fabricRef.current.add(fabricImg);
        fabricRef.current.setActiveObject(fabricImg);
        fabricRef.current.renderAll();
        setIsModalOpen(false);
      };
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 bg-[#f0f2f5] flex overflow-hidden font-sans antialiased text-slate-900">
      
      {/* LEFT COMPACT SIDEBAR */}
      <aside className="w-20 bg-white border-r border-slate-200 flex flex-col items-center py-6 shrink-0 z-50 shadow-2xl">
        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mb-10 shadow-lg shadow-indigo-200">
          <Box size={26} strokeWidth={2.5} />
        </div>
        <div className="flex flex-col gap-5">
          <ToolBtn icon={Upload} label="Files" active={activeTab === 'uploads'} onClick={() => setActiveTab('uploads')} />
          <ToolBtn icon={Type} label="Text" active={activeTab === 'text'} onClick={() => setActiveTab('text')} />
          <ToolBtn icon={Square} label="Shapes" active={activeTab === 'elements'} onClick={() => setActiveTab('elements')} />
          <ToolBtn icon={Settings} label="Material" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
          <div className="h-px w-8 bg-slate-100 mx-auto my-2" />
          <ToolBtn icon={Layers} label="Layers" active={activeTab === 'layers'} onClick={() => setActiveTab('layers')} />
        </div>
      </aside>

      {/* CONTEXT DRAWER */}
      <div className="w-80 bg-white border-r border-slate-200 z-40 p-8 shrink-0 flex flex-col shadow-xl">
        <header className="mb-8">
          <h2 className="text-2xl font-black tracking-tight capitalize">{activeTab}</h2>
          <p className="text-slate-400 text-sm font-medium">Design your custom packaging</p>
        </header>

        <div className="flex-1">
          {activeTab === 'uploads' && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="w-full py-12 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center gap-4 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all group"
            >
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Upload size={28} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Upload Artwork</span>
            </button>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-8">
              <section>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 block">Base Material</label>
                <div className="grid grid-cols-5 gap-3">
                  {['#ffffff', '#f5f5dc', '#d2b48c', '#333333', '#4f46e5'].map(c => (
                    <button 
                      key={c} onClick={() => setBoxColor(c)} 
                      className={`w-10 h-10 rounded-full border-2 ${boxColor === c ? 'border-indigo-600 scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </section>
            </div>
          )}
          
          {/* Placeholder for others */}
          {['text', 'elements', 'layers'].includes(activeTab) && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-300">
               <Grid3X3 size={48} className="mb-4 opacity-20" />
               <p className="text-xs font-bold uppercase tracking-widest">Premium Feature</p>
            </div>
          )}
        </div>

        <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl hover:bg-indigo-600 transition-all">
          <Download size={20} /> Export Files
        </button>
      </div>

      {/* MAIN DESIGN WORKSPACE */}
      <main className="flex-1 relative flex flex-col min-w-0">
        {/* Workspace Top Bar */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-10 z-30 shrink-0">
          <div className="flex items-center gap-6">
            <span className="font-black text-2xl tracking-tighter">PACKDORA<span className="text-indigo-600 underline decoration-4 underline-offset-4">ULTRA</span></span>
            <div className="h-6 w-px bg-slate-200" />
            <div className="flex gap-4 text-slate-400">
              <ZoomIn size={18} className="cursor-pointer hover:text-indigo-600" />
              <Maximize size={18} className="cursor-pointer hover:text-indigo-600" />
              <Ruler size={18} className="cursor-pointer hover:text-indigo-600" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-amber-400 border-2 border-white" />
              <div className="w-8 h-8 rounded-full bg-indigo-400 border-2 border-white" />
            </div>
            <button className="ml-4 px-6 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-100">Share</button>
          </div>
        </header>

        {/* The "Infinite" Designer Area */}
        <div 
          ref={wrapperRef} 
          className="flex-1 relative overflow-hidden flex items-center justify-center bg-[#f0f2f5]"
          style={{ 
            backgroundImage: `radial-gradient(#cbd5e1 1px, transparent 1px)`, 
            backgroundSize: '30px 30px' 
          }}
        >
          <canvas ref={canvasElRef} className="z-10" />
          
          {/* Floating Canvas Tools */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-2xl px-8 py-4 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white flex items-center gap-8 z-30">
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-lg">
               <MousePointer2 size={16} className="text-indigo-600" />
               <span className="text-[10px] font-black uppercase text-slate-500">Selection</span>
            </div>
            <div className="w-px h-6 bg-slate-200" />
            <button onClick={() => fabricRef.current.remove(fabricRef.current.getActiveObject())} className="text-slate-400 hover:text-red-500 transition-all flex flex-col items-center gap-1">
              <Trash2 size={20}/>
              <span className="text-[8px] font-bold uppercase">Delete</span>
            </button>
          </div>
        </div>

        {/* 3. LARGE FLOATING 3D PIP */}
        <div className="absolute top-24 right-10 w-[450px] h-[450px] pointer-events-none z-40">
          <motion.div 
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="w-full h-full bg-[#0f172a] rounded-[3rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.4)] border-[6px] border-white overflow-hidden relative pointer-events-auto"
          >
            <div className="absolute top-6 left-8 z-10 flex items-center gap-3">
               <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_15px_#22c55e]" />
               <span className="text-white text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Real-time Preview</span>
            </div>

            <Canvas shadows className="cursor-grab active:cursor-grabbing">
              <PerspectiveCamera makeDefault position={[5, 4, 5]} fov={35} />
              <ambientLight intensity={0.6} />
              <pointLight position={[10, 10, 10]} intensity={1.5} />
              <spotLight position={[-10, 20, 10]} angle={0.2} intensity={2.5} castShadow />
              
              <Float speed={1.5} rotationIntensity={0.4} floatIntensity={0.4}>
                {isCanvasReady && <BoxModel canvasElement={canvasElRef.current} openValue={openAmount} boxColor={boxColor} />}
              </Float>
              
              <OrbitControls enableZoom={true} makeDefault dampingFactor={0.05} />
              <ContactShadows position={[0, -1.2, 0]} opacity={0.5} scale={15} blur={2.5} color="#000000" />
              <Environment preset="studio" />
            </Canvas>

            {/* PIP Controls */}
            <div className="absolute bottom-8 inset-x-8">
               <div className="bg-white/10 backdrop-blur-2xl p-5 rounded-[2rem] border border-white/10 shadow-2xl">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Fold Animation</span>
                    <span className="text-xs font-mono text-indigo-400 font-bold">{Math.round(openAmount * 100)}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="1" step="0.01" value={openAmount} 
                    onChange={(e) => setOpenAmount(parseFloat(e.target.value))}
                    className="w-full h-1.5 accent-indigo-500 appearance-none bg-white/20 rounded-full cursor-pointer"
                  />
               </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* UPLOAD MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl" onClick={()=>setIsModalOpen(false)} />
            <motion.div initial={{scale:0.9, opacity:0, y: 30}} animate={{scale:1, opacity:1, y: 0}} exit={{scale:0.9, opacity:0, y: 30}} className="bg-white w-full max-w-xl rounded-[3rem] p-12 relative z-10 shadow-2xl overflow-hidden text-center">
              <div className="mb-10">
                <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                   <Upload size={32} />
                </div>
                <h3 className="text-3xl font-black tracking-tight mb-2">Import Media</h3>
                <p className="text-slate-400 font-medium">Upload high-res PNG, JPG or SVG artwork.</p>
              </div>

              <label className="border-4 border-dashed border-slate-100 rounded-[2.5rem] p-20 flex flex-col items-center cursor-pointer hover:bg-slate-50 hover:border-indigo-200 transition-all group">
                <span className="text-sm font-black text-indigo-600 uppercase tracking-widest group-hover:scale-110 transition-transform">Browse Computer</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
              
              <button onClick={() => setIsModalOpen(false)} className="mt-8 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-slate-600 transition-colors">Dismiss</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Sidebar Button Component
function ToolBtn({ icon: Icon, label, active, onClick }) {
  return (
    <button 
      onClick={onClick} 
      className={`w-full flex flex-col items-center gap-2 group transition-all relative ${active ? 'text-indigo-600' : 'text-slate-300 hover:text-slate-500'}`}
    >
      <div className={`p-3.5 rounded-2xl transition-all ${active ? 'bg-indigo-50 shadow-sm' : 'group-hover:bg-slate-50'}`}>
        <Icon size={22} strokeWidth={active ? 2.5 : 2} />
      </div>
      <span className="text-[9px] font-black uppercase tracking-[0.1em]">{label}</span>
      {active && <motion.div layoutId="activeTab" className="absolute -right-0.5 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-600 rounded-l-full" />}
    </button>
  );
}