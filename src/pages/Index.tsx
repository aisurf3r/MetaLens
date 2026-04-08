import { useImageStore } from "@/hooks/useImageStore";
import AppHeader from "@/components/AppHeader";
import UploadZone from "@/components/UploadZone";
import ImageGallery from "@/components/ImageGallery";
import MetadataPanel from "@/components/MetadataPanel";
import MapView from "@/components/MapView";
import { motion } from "framer-motion";
import { ScanSearch, Github, Mail } from "lucide-react";

const Index = () => {
  const { images, selected, selectedId, setSelectedId, addFiles, removeImage, clearAll, exportJSON } = useImageStore();

  return (
    <div className="min-h-screen bg-background relative">
      {/* Grid overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--border) / 0.35) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border) / 0.35) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      {/* Footer social icons */}
      <div className="relative z-10 flex items-center justify-center gap-4 py-8">
        <a
          href="https://github.com/aisurf3r/MetaLens"
          target="_blank"
          rel="noopener noreferrer"
          className="social-icon-btn"
        >
          <Github className="w-5 h-5" />
        </a>
        <a
          href="mailto:aisurf3r@gmail.com"
          className="social-icon-btn"
        >
          <Mail className="w-5 h-5" />
        </a>
      </div>

      <div className="relative z-10">
        <div className="container max-w-7xl mx-auto px-4">
          <AppHeader imageCount={images.length} onExport={exportJSON} onClear={clearAll} />

          {/* Hero title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center justify-center pt-10 pb-6 md:pt-16 md:pb-10"
          >
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 glow-border">
              <ScanSearch className="w-8 h-8 md:w-10 md:h-10 text-primary" />
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-center">
              <span className="gradient-text gradient-text-animated">MetaLens</span>
            </h1>
            <p className="text-muted-foreground text-sm md:text-base mt-3 tracking-wide">
              Image metadata explorer
            </p>
          </motion.div>

          <div className="space-y-6 pb-12">
            {/* Upload */}
            <UploadZone onFiles={addFiles} />

            {images.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-1 lg:grid-cols-5 gap-6"
              >
                {/* Left: Gallery */}
                <div className="lg:col-span-3 space-y-6">
                  <div>
                    <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {images.length} image{images.length !== 1 && "s"} loaded
                    </h2>
                    <ImageGallery
                      images={images}
                      selectedId={selectedId}
                      onSelect={setSelectedId}
                      onRemove={removeImage}
                    />
                  </div>

                  {/* Map */}
                  <div>
                    <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                      Location Map
                    </h2>
                    <MapView images={images} onSelect={setSelectedId} />
                  </div>
                </div>

                {/* Right: Metadata */}
                <div className="lg:col-span-2">
                  <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Metadata
                  </h2>
                  <div className="lg:sticky lg:top-4">
                    <MetadataPanel image={selected} />
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
