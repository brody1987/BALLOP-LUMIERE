import React, { useState, useEffect } from 'react';
import { FashionStyle, GeneratedImage, ImageFile } from './types';
import { hasApiKey, requestApiKey, generateFashionImage } from './services/geminiService';
import ImageUploader from './components/ImageUploader';

// 10 Distinct Editorial Poses
const POSES = [
  "Full body shot, walking towards the camera with a confident stride (Street Style motion).",
  "Three-quarter shot, standing with hands in pockets or resting on hips, looking slightly away from camera.",
  "Seated pose on a prop (chair or stairs), relaxed posture, highlighting the outfit drapery.",
  "Close-up portrait focus (waist up), intense eye contact, highlighting textures.",
  "Low angle hero shot, standing tall and empowering, looking down at the lens.",
  "Dynamic movement shot, fabric flowing, caught mid-turn or mid-step.",
  "Over-the-shoulder shot, looking back at the camera, showcasing back details or profile.",
  "Leaning against a wall or surface, casual yet chic, one leg crossed over the other.",
  "High angle artistic shot, looking up towards the camera.",
  "Side profile silhouette, highlighting the structural shape of the outfit."
];

const App: React.FC = () => {
  const [apiKeyReady, setApiKeyReady] = useState<boolean>(false);
  const [portrait, setPortrait] = useState<ImageFile[]>([]);
  const [products, setProducts] = useState<ImageFile[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<FashionStyle>(FashionStyle.MINIMALIST);
  
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Lightbox State
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);

  // Initial check for API Key
  useEffect(() => {
    const checkKey = async () => {
      try {
        const ready = await hasApiKey();
        setApiKeyReady(ready);
      } catch (e) {
        console.warn("API Key check failed initially", e);
      }
    };
    checkKey();
  }, []);

  const handleConnect = async () => {
    try {
      const ready = await requestApiKey();
      setApiKeyReady(ready);
    } catch (e) {
      console.error("Failed to connect API key", e);
    }
  };

  const handleGenerate = async () => {
    if (portrait.length === 0 || products.length === 0) return;
    
    setIsGenerating(true);
    setProgress(0);
    setGeneratedImages([]);
    setGenerationError(null);

    const totalImages = POSES.length;

    try {
      // Generate 10 images sequentially using specific poses
      for (let i = 0; i < totalImages; i++) {
        try {
           const currentPose = POSES[i];
           
           const base64Img = await generateFashionImage(
             portrait[0].base64,
             products.map(p => p.base64),
             selectedStyle,
             currentPose
           );

           const newImage: GeneratedImage = {
             id: `gen-${Date.now()}-${i}`,
             url: base64Img,
             prompt: `${selectedStyle} | ${currentPose}`
           };

           setGeneratedImages(prev => [...prev, newImage]); // Update UI incrementally
           setProgress(((i + 1) / totalImages) * 100);

        } catch (err) {
          console.error(`Error generating image ${i + 1}`, err);
          // Continue trying other images even if one fails
        }
      }
    } catch (error: any) {
      setGenerationError(error.message || "An error occurred during generation.");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = (url: string, id: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `lumiere-editorial-${id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!apiKeyReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-brand-black">
        <h1 className="font-serif text-6xl text-brand-cream mb-4 tracking-tighter">Lumière</h1>
        <p className="font-sans text-brand-gray mb-12 text-lg font-light tracking-wide max-w-md">
          The autonomous AI fashion editorial studio. Synthesize models and products into high-fashion art.
        </p>
        <button 
          onClick={handleConnect}
          className="px-8 py-4 bg-brand-gold text-brand-black font-sans font-bold uppercase tracking-widest hover:bg-white transition-colors"
        >
          Connect AI Studio
        </button>
        <p className="mt-8 text-xs text-brand-gray max-w-xs">
          This application requires a Google Cloud Project with billing enabled to access the high-quality Gemini 3 Pro Image model.
          <br/>
          <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="underline hover:text-brand-gold">
            Learn more about billing
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-black text-brand-cream selection:bg-brand-gold selection:text-black">
      {/* Header */}
      <header className="border-b border-white/10 p-6 sticky top-0 z-40 bg-brand-black/80 backdrop-blur-md flex justify-between items-center">
        <h1 className="font-serif text-2xl md:text-3xl tracking-tight">Lumière Editorial</h1>
        
        <div className="flex items-center gap-6">
          {isGenerating && (
            <div className="flex items-center gap-3">
              <div className="w-32 h-1 bg-neutral-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-brand-gold transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="font-sans text-xs tracking-widest text-brand-gold">{Math.round(progress)}%</span>
            </div>
          )}

          <button 
            onClick={handleConnect}
            className="text-xs font-sans tracking-widest text-neutral-500 hover:text-brand-cream uppercase border-b border-transparent hover:border-brand-cream transition-all pb-0.5"
          >
            API Key
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 md:p-12 space-y-20">
        
        {/* Input Section */}
        <section className={`transition-opacity duration-700 ${isGenerating ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Left Col: Uploads */}
            <div className="lg:col-span-7 space-y-12">
              <ImageUploader 
                label="01. The Model" 
                subLabel="Upload a portrait photo"
                images={portrait}
                onImagesChange={setPortrait}
                maxFiles={1}
              />
              <ImageUploader 
                label="02. The Collection" 
                subLabel="Upload product photos (Max 3). Details will be preserved."
                images={products}
                onImagesChange={setProducts}
                multiple
                maxFiles={3}
              />
            </div>

            {/* Right Col: Controls */}
            <div className="lg:col-span-5 flex flex-col justify-end space-y-8">
              <div className="space-y-4">
                <label className="text-brand-cream font-serif text-xl block">03. Aesthetic</label>
                <div className="grid grid-cols-1 gap-2">
                  {Object.values(FashionStyle).map((style) => (
                    <button
                      key={style}
                      onClick={() => setSelectedStyle(style)}
                      className={`text-left px-4 py-3 border font-sans text-sm tracking-wide transition-all
                        ${selectedStyle === style 
                          ? 'border-brand-gold text-brand-gold bg-brand-gold/5' 
                          : 'border-neutral-800 text-neutral-400 hover:border-neutral-600'
                        }`}
                    >
                      {style.split(',')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={handleGenerate}
                disabled={portrait.length === 0 || products.length === 0 || isGenerating}
                className="w-full py-6 bg-brand-cream text-brand-black font-serif text-xl italic hover:bg-brand-gold disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                {isGenerating ? 'Synthesizing...' : 'Generate 10 Variations'}
              </button>
              
              {generationError && (
                <p className="text-red-500 font-sans text-sm mt-2">{generationError}</p>
              )}
            </div>
          </div>
        </section>

        {/* Gallery Section */}
        {(generatedImages.length > 0 || isGenerating) && (
          <section className="space-y-8 pt-12 border-t border-white/10">
            <div className="flex items-baseline justify-between">
              <h2 className="font-serif text-4xl">The Issue</h2>
              <span className="font-sans text-sm text-brand-gray tracking-widest">VOL. 01 / {generatedImages.length} SHOTS</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1">
              {generatedImages.map((img, idx) => (
                <div 
                  key={img.id} 
                  onClick={() => setSelectedImage(img)}
                  className="group relative aspect-[3/4] overflow-hidden bg-neutral-900 cursor-zoom-in"
                >
                  <img 
                    src={img.url} 
                    alt={`Editorial ${idx}`} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-4">
                    <span className="text-white/80 font-sans text-xs tracking-widest uppercase">View Full Size</span>
                  </div>
                  
                  {/* Magazine Text Overlay Effect */}
                  <div className="absolute bottom-4 left-4 pointer-events-none mix-blend-difference">
                     <p className="text-white font-serif italic text-2xl opacity-80">Lumière</p>
                  </div>
                </div>
              ))}
              
              {/* Skeletons for pending images */}
              {isGenerating && Array.from({ length: Math.max(0, POSES.length - generatedImages.length) }).map((_, i) => (
                <div key={`skel-${i}`} className="aspect-[3/4] bg-neutral-900 border border-neutral-800 flex items-center justify-center animate-pulse">
                   <span className="font-serif text-neutral-800 text-4xl italic">Synthesizing...</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
      
      <footer className="border-t border-white/10 py-12 text-center">
        <p className="font-sans text-neutral-600 text-xs tracking-widest uppercase">
          Powered by Gemini 3 Pro Vision
        </p>
      </footer>

      {/* Lightbox / Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 md:p-8 animate-in fade-in duration-200">
          <button 
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 md:top-8 md:right-8 text-white hover:text-brand-gold transition-colors z-[110]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
          
          <div className="relative max-w-full max-h-full flex flex-col items-center">
            <img 
              src={selectedImage.url} 
              alt="Editorial Full" 
              className="max-h-[85vh] max-w-full object-contain shadow-2xl"
            />
            
            <div className="mt-6 flex gap-4">
               <button 
                  onClick={() => downloadImage(selectedImage.url, selectedImage.id)}
                  className="px-8 py-3 bg-white text-black font-sans font-bold uppercase tracking-widest hover:bg-brand-gold transition-colors"
                >
                  Download High-Res
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;