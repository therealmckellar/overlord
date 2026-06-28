import React, { useState } from 'react';
import { useD2CStore } from '@/stores/d2cStore';
import { Upload, Sparkles, Box, Layout, CheckCircle2 } from 'lucide-react';

const DesignToCodePanel: React.FC = () => {
  const { 
    uploadedImage, generatedSpec, isGenerating, isCreatingWorkspace, 
    setUploadedImage, setGeneratedSpec, setGenerating, setCreatingWorkspace, setError 
  } = useD2CStore();
  const [file, setFile] = useState<File | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const uploadedFile = e.target.files[0];
    setFile(uploadedFile);

    const formData = new FormData();
    formData.append('file', uploadedFile);

    try {
      const res = await fetch('/api/d2c/upload', { method: 'POST', body: formData });
      const data = await res.json();
      setUploadedImage(data.url);
    } catch (e) {
      setError('Upload failed');
    }
  };

  const generateCode = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/d2c/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: uploadedImage }),
      });
      const data = await res.json();
      setGeneratedSpec(data.spec);
    } catch (e) {
      setError('Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const createWorkspace = async () => {
    setCreatingWorkspace(true);
    try {
      const res = await fetch('/api/d2c/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spec: generatedSpec }),
      });
      const data = await res.json();
      alert('Workspace created successfully!');
    } catch (e) {
      setError('Workspace creation failed');
    } finally {
      setCreatingWorkspace(false);
    }
  };

  return (
    <div className="flex h-full w-full bg-zinc-950 text-zinc-100 rounded-xl border border-zinc-800 overflow-hidden">
      <div className="w-1/2 border-r border-zinc-800 p-6 flex flex-col gap-6">
        <div className="flex items-center gap-2 font-bold text-lg mb-2">
          <Layout className="w-5 h-5 text-purple-400" />
          <span>Design-to-Code</span>
        </div>

        <div 
          className={`relative aspect-square w-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-colors ${
            uploadedImage ? 'border-zinc-700' : 'border-zinc-800 hover:border-purple-500/50 bg-zinc-900/50'
          }`}
        >
          {uploadedImage ? (
            <img src={uploadedImage} alt="Mockup" className="absolute inset-0 w-full h-full object-contain p-2" />
          ) : (
            <div className="text-center p-4">
              <Upload className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
              <p className="text-sm text-zinc-400 mb-4">Upload design mockup image</p>
              <label className="cursor-pointer bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-md text-sm font-medium transition-colors">
                Select Image
                <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
              </label>
            </div>
          )}
        </div>

        <button 
          disabled={!uploadedImage || isGenerating}
          onClick={generateCode}
          className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 disabled:text-zinc-500 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
        >
          {isGenerating ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" /> : <Sparkles className="w-5 h-5" />}
          {isGenerating ? 'Analyzing Design...' : 'Generate Component Code'}
        </button>
      </div>

      <div className="w-1/2 p-6 flex flex-col gap-6 overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 font-bold text-lg">
            <Box className="w-5 h-5 text-purple-400" />
            <span>Generated Spec</span>
          </div>
          {generatedSpec && (
            <button 
              onClick={createWorkspace}
              disabled={isCreatingWorkspace}
              className="px-3 py-1.5 bg-green-600 hover:bg-green-500 disabled:bg-zinc-800 rounded-md text-xs font-bold flex items-center gap-1 transition-colors"
            >
              {isCreatingWorkspace ? 'Creating...' : <><CheckCircle2 className="w-3 h-3" /> Create Workspace</>}
            </button>
          )}
        </div>

        {!generatedSpec ? (
          <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm bg-zinc-900/30 rounded-xl border border-zinc-800">
            Generate code to see the component preview
          </div>
        ) : (
          <div className="flex-1 flex flex-col gap-4 overflow-hidden">
            <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800 overflow-auto max-h-1/2">
              <div className="text-xs font-mono text-purple-400 mb-2">// Component Specification</div>
              <pre className="text-xs text-zinc-300 whitespace-pre-wrap font-mono">
                {JSON.stringify(generatedSpec, null, 2)}
              </pre>
            </div>
            
            <div className="flex-1 bg-white rounded-xl overflow-hidden relative">
              <div className="absolute top-2 left-2 px-2 py-1 bg-zinc-200 text-zinc-600 text-[10px] rounded font-bold uppercase">Live Preview</div>
              <div className="w-full h-full p-4 overflow-auto" dangerouslySetInnerHTML={{ __html: generatedSpec.html }} />
              <style>{generatedSpec.css}</style>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DesignToCodePanel;
