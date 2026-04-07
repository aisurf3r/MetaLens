import { useImageStore } from "@/hooks/useImageStore";
import AppHeader from "@/components/AppHeader";
import UploadZone from "@/components/UploadZone";
import ImageGallery from "@/components/ImageGallery";
import MetadataPanel from "@/components/MetadataPanel";
import MapView from "@/components/MapView";
import { motion } from "framer-motion";

const Index = () => {
  const { images, selected, selectedId, setSelectedId, addFiles, removeImage, clearAll, exportJSON } = useImageStore();

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto px-4">
        <AppHeader imageCount={images.length} onExport={exportJSON} onClear={clearAll} />

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
  );
};

export default Index;
